import { daysOwnedFrom, isValidDateKey, parseDateKey, todayKey } from "@/lib/date";
import { dailyCostCents } from "@/lib/money";
import type { ExpiryInfo, Purchase } from "@/types/ledger";

export const EXPIRY_REASONS = ["坏了", "丢了", "卖掉", "退掉", "送人"] as const;
export const MAX_REASON_LENGTH = 60;

export function normalizeReason(input: string): string {
  return input.trim().slice(0, MAX_REASON_LENGTH);
}

/** 失效日必须落在「购买日 ~ 今天」之间，两端都合法 */
export function isValidExpiryDate(
  expiredOn: string,
  purchasedAt: string,
  today: string = todayKey(),
): boolean {
  if (!isValidDateKey(expiredOn) || !isValidDateKey(purchasedAt) || !isValidDateKey(today)) return false;
  const value = parseDateKey(expiredOn);
  const start = parseDateKey(purchasedAt);
  const end = parseDateKey(today);
  if (value === null || start === null || end === null) return false;
  return value >= start && value <= end;
}

export function expiryPreview(purchase: Pick<Purchase, "purchasedAt" | "priceCents">, expiredOn: string) {
  const daysOwned = daysOwnedFrom(purchase.purchasedAt, expiredOn);
  return { daysOwned, dailyCostCents: dailyCostCents(purchase.priceCents, daysOwned) };
}

/** 盖章瞬间一次性算出定格值并写入，之后归档展示只读这些字段 */
export function buildExpiry(
  purchase: Purchase,
  expiredOn: string,
  reason: string,
  now: number = Date.now(),
): ExpiryInfo {
  const { daysOwned, dailyCostCents: finalDailyCostCents } = expiryPreview(purchase, expiredOn);
  return {
    reason: normalizeReason(reason),
    expiredOn,
    expiredAt: now,
    finalDaysOwned: daysOwned,
    finalDailyCostCents,
  };
}

export function formatExpiredAt(timestamp: number): string {
  return new Date(timestamp).toLocaleString("zh-CN", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** 导入/读取本地数据时容错：固化值缺失或非法则按失效日兜底重算 */
export function normalizeExpiry(
  raw: unknown,
  purchase: Pick<Purchase, "purchasedAt" | "priceCents">,
): ExpiryInfo | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const value = raw as Record<string, unknown>;
  const rawOn = typeof value.expiredOn === "string" ? value.expiredOn : "";
  const today = todayKey();
  const expiredOn = isValidExpiryDate(rawOn, purchase.purchasedAt, today)
    ? rawOn
    : isValidExpiryDate(today, purchase.purchasedAt, today)
      ? today
      : purchase.purchasedAt;
  const reason = typeof value.reason === "string" ? normalizeReason(value.reason) : "";
  const fallback = expiryPreview(purchase, expiredOn);
  const finalDaysOwned =
    typeof value.finalDaysOwned === "number" &&
    Number.isSafeInteger(value.finalDaysOwned) &&
    value.finalDaysOwned > 0
      ? value.finalDaysOwned
      : fallback.daysOwned;
  const finalDailyCostCents =
    typeof value.finalDailyCostCents === "number" &&
    Number.isSafeInteger(value.finalDailyCostCents) &&
    value.finalDailyCostCents >= 0
      ? value.finalDailyCostCents
      : fallback.dailyCostCents;
  return {
    reason: reason || "未填写原因",
    expiredOn,
    expiredAt:
      typeof value.expiredAt === "number" && Number.isFinite(value.expiredAt)
        ? value.expiredAt
        : Date.now(),
    finalDaysOwned,
    finalDailyCostCents,
  };
}

export function splitPurchases(purchases: Purchase[]) {
  const active: Purchase[] = [];
  const archived: Purchase[] = [];
  for (const purchase of purchases) {
    if (purchase.expiry) archived.push(purchase);
    else active.push(purchase);
  }
  return { active, archived };
}
