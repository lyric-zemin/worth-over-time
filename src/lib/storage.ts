import type { StateStorage } from "zustand/middleware";
import { isValidDateKey } from "@/lib/date";
import { normalizeExpiry } from "@/lib/expiry";
import { DEFAULT_ICON_KEY, getIcon } from "@/lib/icons";
import {
  DATA_VERSION,
  type AppData,
  type LedgerData,
  type LedgerSettings,
  type Purchase,
  type SortKey,
  type ViewSnapshot,
} from "@/types/ledger";

export { DATA_VERSION } from "@/types/ledger";

export const STORAGE_KEY = "worth-over-time-ledger-v1";
export const STORAGE_ERROR_EVENT = "worth-over-time:storage-error";
export const MAX_IMAGE_DATA_URL_LENGTH = 220_000;
export const MAX_IMPORT_FILE_BYTES = 8 * 1024 * 1024;
export const LOCAL_STORAGE_BUDGET_BYTES = 5 * 1024 * 1024;

export const DEFAULT_SETTINGS: LedgerSettings = { sortBy: "recent", haptics: true, showArchived: true };

const SORT_KEYS: SortKey[] = ["recent", "oldest", "daily-high", "price-high"];

export function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function notifyStorageError(message: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(STORAGE_ERROR_EVENT, { detail: message }));
  }
}

/** zustand persist 使用的安全适配器：配额失败时保留内存状态并广播可操作提示 */
export const ledgerStorage: StateStorage = {
  getItem(name) {
    try {
      return window.localStorage.getItem(name);
    } catch (error) {
      console.error("读取本地数据失败", error);
      return null;
    }
  },
  setItem(name, value) {
    try {
      window.localStorage.setItem(name, value);
    } catch (error) {
      console.error("写入本地数据失败", error);
      notifyStorageError("浏览器存储空间不足，请先删除几张上传的图片或导出备份后清理数据");
    }
  },
  removeItem(name) {
    try {
      window.localStorage.removeItem(name);
    } catch (error) {
      console.error("清理本地数据失败", error);
    }
  },
};

export function getStorageUsageBytes(): number {
  try {
    let bytes = 0;
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (!key || !key.startsWith("worth-over-time-")) continue;
      bytes += (key.length + (window.localStorage.getItem(key)?.length ?? 0)) * 2;
    }
    return bytes;
  } catch (error) {
    console.error("统计存储用量失败", error);
    return 0;
  }
}

export function normalizePurchase(raw: unknown): Purchase | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  const name = typeof value.name === "string" ? value.name.trim().slice(0, 40) : "";
  const priceCents =
    typeof value.priceCents === "number" && Number.isSafeInteger(value.priceCents) && value.priceCents > 0
      ? value.priceCents
      : null;
  const purchasedAt =
    typeof value.purchasedAt === "string" && isValidDateKey(value.purchasedAt) ? value.purchasedAt : null;
  if (!name || priceCents === null || !purchasedAt) return null;

  const iconKey =
    typeof value.iconKey === "string" && getIcon(value.iconKey).key === value.iconKey
      ? value.iconKey
      : DEFAULT_ICON_KEY;
  const iconImageDataUrl =
    typeof value.iconImageDataUrl === "string" &&
    value.iconImageDataUrl.startsWith("data:image/") &&
    value.iconImageDataUrl.length <= MAX_IMAGE_DATA_URL_LENGTH
      ? value.iconImageDataUrl
      : undefined;

  const purchase: Purchase = {
    id: typeof value.id === "string" && value.id ? value.id.slice(0, 80) : createId(),
    name,
    priceCents,
    purchasedAt,
    iconKey,
    iconImageDataUrl,
    createdAt:
      typeof value.createdAt === "number" && Number.isFinite(value.createdAt)
        ? value.createdAt
        : Date.now(),
  };
  const expiry = normalizeExpiry(value.expiry, purchase);
  if (expiry) purchase.expiry = expiry;
  return purchase;
}

export function normalizeSettings(raw: unknown): LedgerSettings {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_SETTINGS };
  const value = raw as Record<string, unknown>;
  return {
    sortBy: SORT_KEYS.includes(value.sortBy as SortKey) ? (value.sortBy as SortKey) : "recent",
    haptics: typeof value.haptics === "boolean" ? value.haptics : true,
    showArchived: typeof value.showArchived === "boolean" ? value.showArchived : true,
  };
}

export function normalizeSnapshot(raw: unknown): ViewSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  if (typeof value.todayKey !== "string" || !isValidDateKey(value.todayKey)) return null;
  const items = Array.isArray(value.items)
    ? value.items.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const entry = item as Record<string, unknown>;
        if (typeof entry.id !== "string") return [];
        return [{
          id: entry.id,
          daysOwned: Math.max(1, Math.round(Number(entry.daysOwned) || 1)),
          dailyCostCents: Math.max(0, Math.round(Number(entry.dailyCostCents) || 0)),
        }];
      })
    : [];
  return {
    viewedAt: typeof value.viewedAt === "number" ? value.viewedAt : Date.now(),
    todayKey: value.todayKey,
    items,
    totalDailyCostCents: Math.max(0, Math.round(Number(value.totalDailyCostCents) || 0)),
    totalCents: Math.max(0, Math.round(Number(value.totalCents) || 0)),
    purchaseCount: Math.max(0, Math.round(Number(value.purchaseCount) || items.length)),
  };
}

/** 同时兼容 zustand persist 包裹结构与导出的纯数据结构 */
export function normalizeLedgerData(input: unknown): LedgerData {
  const root = (input ?? {}) as Record<string, unknown>;
  const source = (typeof root.state === "object" && root.state ? root.state : root) as Record<string, unknown>;
  const purchases = Array.isArray(source.purchases)
    ? source.purchases.map(normalizePurchase).filter((item): item is Purchase => item !== null)
    : [];
  const seen = new Set<string>();
  return {
    purchases: purchases.filter((purchase) => {
      if (seen.has(purchase.id)) return false;
      seen.add(purchase.id);
      return true;
    }),
    settings: normalizeSettings(source.settings),
    lastView: normalizeSnapshot(source.lastView),
  };
}

export function buildAppData(
  data: LedgerData,
  extras: { accent?: string; themeMode?: string } = {},
): AppData {
  return {
    app: "worth-over-time",
    version: DATA_VERSION,
    exportedAt: Date.now(),
    purchases: data.purchases,
    settings: data.settings,
    lastView: data.lastView,
    ...extras,
  };
}
