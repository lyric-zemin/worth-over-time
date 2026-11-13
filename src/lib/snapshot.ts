import { calendarDaysBetween } from "@/lib/date";
import { computeStats } from "@/lib/money";
import type { DeltaSummary, ItemDelta, Purchase, ViewSnapshot } from "@/types/ledger";

export function createSnapshot(purchases: Purchase[], key: string): ViewSnapshot {
  // computeStats 只返回有效小票，快照自然不含归档项；
  // diffSnapshots 会跳过「上次有、这次没有」的 id，因此盖章失效不会被误算成每天省钱。
  const { stats, totalCents, totalDailyCostCents, count } = computeStats(purchases, key);
  return {
    viewedAt: Date.now(),
    todayKey: key,
    items: stats.map(({ purchase, daysOwned, dailyCostCents }) => ({
      id: purchase.id,
      daysOwned,
      dailyCostCents,
    })),
    totalDailyCostCents,
    totalCents,
    purchaseCount: count,
  };
}

/**
 * 只对比两批快照里都存在的商品，避免期间新增/删除的记录污染
 * 「时间让每天更便宜」这条结论；新增记录只做计数。
 */
export function diffSnapshots(
  previous: ViewSnapshot | null,
  current: ViewSnapshot,
  purchases: Purchase[],
): DeltaSummary {
  if (!previous) {
    return {
      elapsedDays: 0,
      daysGained: 0,
      dailyCostSavedCents: 0,
      changedItems: [],
      newPurchaseCount: 0,
      isFirstVisit: true,
      hasChange: false,
      previousDailyCostCents: 0,
      currentDailyCostCents: 0,
    };
  }

  const elapsedDays = Math.max(0, calendarDaysBetween(previous.todayKey, current.todayKey));
  const previousById = new Map(previous.items.map((item) => [item.id, item]));
  const currentById = new Map(current.items.map((item) => [item.id, item]));
  const nameById = new Map(purchases.map((purchase) => [purchase.id, purchase.name]));
  const previousIds = new Set(previous.items.map((item) => item.id));

  const changedItems: ItemDelta[] = [];
  let previousDailyCostCents = 0;
  let currentDailyCostCents = 0;
  let daysGained = 0;

  for (const [id, before] of previousById) {
    const after = currentById.get(id);
    if (!after) continue;
    previousDailyCostCents += before.dailyCostCents;
    currentDailyCostCents += after.dailyCostCents;
    daysGained = Math.max(daysGained, after.daysOwned - before.daysOwned);
    if (after.daysOwned !== before.daysOwned || after.dailyCostCents !== before.dailyCostCents) {
      changedItems.push({
        id,
        name: nameById.get(id) ?? "已删除的小票",
        fromDays: before.daysOwned,
        toDays: after.daysOwned,
        fromDailyCostCents: before.dailyCostCents,
        toDailyCostCents: after.dailyCostCents,
      });
    }
  }

  const newPurchaseCount = current.items.filter((item) => !previousIds.has(item.id)).length;
  const dailyCostSavedCents = Math.max(0, previousDailyCostCents - currentDailyCostCents);

  return {
    elapsedDays,
    daysGained,
    dailyCostSavedCents,
    changedItems,
    newPurchaseCount,
    isFirstVisit: false,
    hasChange: elapsedDays > 0 && (changedItems.length > 0 || daysGained > 0),
    lastViewedAt: previous.viewedAt,
    previousDailyCostCents,
    currentDailyCostCents,
  };
}
