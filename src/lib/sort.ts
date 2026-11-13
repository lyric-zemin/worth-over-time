import type { PurchaseStat } from "@/lib/money";
import type { SortKey } from "@/types/ledger";

/** 主列表与归档区共用同一套排序，保证两处顺序一致 */
export function sortPurchaseStats(stats: PurchaseStat[], sortBy: SortKey): PurchaseStat[] {
  const copy = [...stats];
  switch (sortBy) {
    case "oldest":
      return copy.sort((a, b) => a.purchase.purchasedAt.localeCompare(b.purchase.purchasedAt));
    case "daily-high":
      return copy.sort((a, b) => b.dailyCostCents - a.dailyCostCents);
    case "price-high":
      return copy.sort((a, b) => b.purchase.priceCents - a.purchase.priceCents);
    default:
      return copy.sort((a, b) => b.purchase.createdAt - a.purchase.createdAt);
  }
}
