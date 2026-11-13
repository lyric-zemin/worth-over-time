import { daysOwnedFrom } from "@/lib/date";
import type { Purchase } from "@/types/ledger";

export interface PurchaseStat {
  purchase: Purchase;
  daysOwned: number;
  dailyCostCents: number;
}

export interface LedgerTotals {
  stats: PurchaseStat[];
  totalCents: number;
  totalDailyCostCents: number;
  count: number;
}

/** 只接受两位小数以内的正数金额，返回整数分 */
export function parsePriceToCents(input: string): number | null {
  let value = input.trim().replace(/[¥￥,，\s]/g, "");
  if (value.startsWith(".")) value = `0${value}`;
  if (!/^\d+(\.\d{0,2})?$/.test(value)) return null;
  const [whole, fraction = ""] = value.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents) || cents <= 0 || cents > 99_999_999_999) return null;
  return cents;
}

export function formatCents(cents: number, withSymbol = true): string {
  const safe = Math.round(cents);
  const sign = safe < 0 ? "-" : "";
  const absolute = Math.abs(safe);
  const yuan = Math.floor(absolute / 100).toLocaleString("zh-CN");
  const fen = String(absolute % 100).padStart(2, "0");
  return `${sign}${withSymbol ? "¥" : ""}${yuan}.${fen}`;
}

export function formatCentsParts(cents: number): { yuan: string; fen: string; sign: string } {
  const safe = Math.round(cents);
  const sign = safe < 0 ? "-" : "";
  const absolute = Math.abs(safe);
  return {
    sign,
    yuan: Math.floor(absolute / 100).toLocaleString("zh-CN"),
    fen: String(absolute % 100).padStart(2, "0"),
  };
}

export function dailyCostCents(priceCents: number, daysOwned: number): number {
  return Math.round(priceCents / Math.max(1, daysOwned));
}

/** 单次遍历得到有效小票与合计；已失效项不进入活跃账本 */
export function computeStats(purchases: Purchase[], key: string): LedgerTotals {
  let totalCents = 0;
  let totalDailyCostCents = 0;
  const stats: PurchaseStat[] = [];
  for (const purchase of purchases) {
    if (purchase.expiry) continue;
    const daysOwned = daysOwnedFrom(purchase.purchasedAt, key);
    const dailyCost = dailyCostCents(purchase.priceCents, daysOwned);
    totalCents += purchase.priceCents;
    totalDailyCostCents += dailyCost;
    stats.push({ purchase, daysOwned, dailyCostCents: dailyCost });
  }
  return { stats, totalCents, totalDailyCostCents, count: stats.length };
}

/** 归档卡片只读固化字段，不再按今天重新折旧 */
export function computeArchivedStats(purchases: Purchase[]): PurchaseStat[] {
  const stats: PurchaseStat[] = [];
  for (const purchase of purchases) {
    if (!purchase.expiry) continue;
    stats.push({
      purchase,
      daysOwned: purchase.expiry.finalDaysOwned,
      dailyCostCents: purchase.expiry.finalDailyCostCents,
    });
  }
  return stats;
}

/** 生活化对照文案，把抽象的日均成本换成可感知的小事 */
export function costMetaphor(cents: number): string {
  if (cents <= 0) return "几乎不花钱了";
  if (cents < 50) return "每天约等于一口自来水";
  if (cents < 200) return "每天约等于坐一次公交";
  if (cents < 500) return "每天约等于一杯豆浆";
  if (cents < 1500) return "每天约等于一杯咖啡";
  if (cents < 5000) return "每天约等于一顿午饭";
  if (cents < 20000) return "每天约等于一张电影票";
  return "每天依然是一笔不小的投入";
}
