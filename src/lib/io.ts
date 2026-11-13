import { isValidDateKey, todayKey } from "@/lib/date";
import { formatExpiredAt, splitPurchases } from "@/lib/expiry";
import { matchIconByName } from "@/lib/icons";
import { computeArchivedStats, computeStats, formatCents, parsePriceToCents } from "@/lib/money";
import {
  DATA_VERSION,
  DEFAULT_SETTINGS,
  MAX_IMPORT_FILE_BYTES,
  createId,
  normalizeLedgerData,
} from "@/lib/storage";
import type { LedgerData, Purchase } from "@/types/ledger";

export interface ImportResult {
  data: LedgerData;
  kind: "json" | "csv";
  accent?: string;
  themeMode?: string;
}

function downloadText(filename: string, text: string, mime: string) {
  try {
    const blob = new Blob([text], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    // 保留锚点直到下载真正开始，过早移除或释放会中断 Blob 下载。
    window.setTimeout(() => {
      anchor.remove();
      URL.revokeObjectURL(url);
    }, 10_000);
  } catch (error) {
    console.error("导出文件失败", error);
    throw new Error("浏览器没能生成下载文件，请换个浏览器再试");
  }
}

function stampedFilename(extension: string) {
  return `时间小票-${todayKey()}.${extension}`;
}

export function exportJsonBackup(contents: string) {
  downloadText(stampedFilename("json"), contents, "application/json");
}

function csvCell(value: string | number) {
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** CSV 是查阅型表格：导出全部小票（含失效列），但导入只构造有效小票，完整恢复走 JSON */
export function exportCsv(purchases: Purchase[]) {
  const { active, archived } = splitPurchases(purchases);
  const activeStats = computeStats(active, todayKey()).stats;
  const archivedStats = computeArchivedStats(archived);
  const lines: (string | number)[][] = [
    ["商品名称", "价格(元)", "购买日期", "状态", "共陪伴天数", "日均成本(元)", "失效日期", "失效原因", "记录时间", "图标"],
    ...activeStats.map(({ purchase, daysOwned, dailyCostCents }) => [
      purchase.name,
      formatCents(purchase.priceCents, false),
      purchase.purchasedAt,
      "有效",
      daysOwned,
      formatCents(dailyCostCents, false),
      "",
      "",
      "",
      purchase.name,
    ]),
    ...archivedStats.map(({ purchase, daysOwned, dailyCostCents }) => {
      const expiry = purchase.expiry!;
      return [
        purchase.name,
        formatCents(purchase.priceCents, false),
        purchase.purchasedAt,
        "已失效",
        daysOwned,
        formatCents(dailyCostCents, false),
        expiry.expiredOn,
        expiry.reason,
        formatExpiredAt(expiry.expiredAt),
        purchase.name,
      ];
    }),
  ];
  const text = `\ufeff${lines.map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
  downloadText(stampedFilename("csv"), text, "text/csv");
}

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const source = text.replace(/^\ufeff/, "");
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (quoted) {
      if (char === '"' && source[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && source[index + 1] === "\n") index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((entry) => entry.some((value) => value.trim() !== ""));
}

function normalizeCsvDate(value: string): string | null {
  const trimmed = value.trim();
  if (isValidDateKey(trimmed)) return trimmed;
  const match = /^(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日$/.exec(trimmed);
  if (!match) return null;
  const key = `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
  return isValidDateKey(key) ? key : null;
}

function parseCsvPurchases(text: string): Purchase[] {
  const rows = parseCsvRows(text);
  if (rows.length < 2) throw new Error("CSV 里没有可导入的小票");
  const header = rows[0].map((cell) => cell.toLowerCase());
  const findColumn = (...names: string[]) =>
    header.findIndex((cell) => names.some((name) => cell.includes(name)));
  const nameIndex = findColumn("名称", "商品", "name", "item");
  const priceIndex = findColumn("价格", "金额", "price", "amount");
  const dateIndex = findColumn("购买", "日期", "date");
  const statusIndex = header.findIndex((cell) => cell.includes("状态"));
  if (nameIndex < 0 || priceIndex < 0 || dateIndex < 0) {
    throw new Error("CSV 需要包含「商品名称 / 价格 / 购买日期」三列");
  }

  const purchases: Purchase[] = [];
  let archivedRows = 0;
  for (const row of rows.slice(1)) {
    if (statusIndex >= 0 && row[statusIndex]?.includes("失效")) {
      archivedRows += 1;
      continue;
    }
    const name = row[nameIndex]?.trim();
    const priceCents = parsePriceToCents(row[priceIndex] ?? "");
    const purchasedAt = normalizeCsvDate(row[dateIndex] ?? "");
    if (!name || priceCents === null || !purchasedAt) continue;
    purchases.push({
      id: createId(),
      name: name.slice(0, 40),
      priceCents,
      purchasedAt,
      iconKey: matchIconByName(name).key,
      createdAt: Date.now() + purchases.length,
    });
  }
  if (!purchases.length) {
    throw new Error(
      archivedRows > 0
        ? "这份 CSV 里只有已失效的小票，完整恢复请用 JSON 备份"
        : "CSV 里的行都不完整，请检查价格与日期格式",
    );
  }
  return purchases;
}

export async function readImportFile(file: File): Promise<ImportResult> {
  if (file.size > MAX_IMPORT_FILE_BYTES) {
    throw new Error("文件超过 8 MB，请导入更小的备份");
  }
  const text = await file.text();
  if (/\.csv$/i.test(file.name) || !text.trimStart().startsWith("{")) {
    const purchases = parseCsvPurchases(text);
    return {
      kind: "csv",
      data: { purchases, settings: { ...DEFAULT_SETTINGS }, lastView: null },
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    console.error("解析备份文件失败", error);
    throw new Error("这不是有效的 JSON 备份文件");
  }
  const root = parsed as Record<string, unknown>;
  if (typeof root.version === "number" && root.version > DATA_VERSION) {
    throw new Error("备份文件由更新版本的应用生成，请先升级应用");
  }
  const data = normalizeLedgerData(parsed);
  const rawPurchases = (Array.isArray(root.purchases) ? root.purchases : []).length;
  if (rawPurchases > 0 && data.purchases.length === 0) {
    throw new Error("备份里的小票数据格式不正确");
  }
  return {
    kind: "json",
    data,
    accent: typeof root.accent === "string" ? root.accent : undefined,
    themeMode: typeof root.themeMode === "string" ? root.themeMode : undefined,
  };
}

/** 合并导入：同 id 保留本地版本，只追加新小票 */
export function mergePurchases(current: Purchase[], incoming: Purchase[]) {
  const known = new Set(current.map((purchase) => purchase.id));
  const added = incoming.filter((purchase) => !known.has(purchase.id));
  return { purchases: [...current, ...added], added: added.length };
}
