"use client";

import { useLedgerUi } from "@/components/layout/app-ui-provider";
import { DeltaBanner } from "@/components/home/delta-banner";
import { ReceiptList } from "@/components/home/receipt-list";
import { SummaryCard } from "@/components/home/summary-card";
import { useLedgerStore } from "@/store/use-ledger-store";
import type { SortKey } from "@/types/ledger";

export function HomeView() {
  const { delta, deltaMap, stats, archivedStats, openCreate, openDetail, deletePurchase } = useLedgerUi();
  const sortBy = useLedgerStore((state) => state.settings.sortBy);
  const showArchived = useLedgerStore((state) => state.settings.showArchived);
  const setSettings = useLedgerStore((state) => state.setSettings);

  return (
    <>
      <DeltaBanner
        delta={delta}
        activeCount={stats.count}
        archivedCount={archivedStats.length}
        onStart={openCreate}
      />
      <SummaryCard
        totalCents={stats.totalCents}
        totalDailyCostCents={stats.totalDailyCostCents}
        count={stats.count}
        archivedCount={archivedStats.length}
      />
      <ReceiptList
        stats={stats.stats}
        archivedStats={archivedStats}
        sortBy={sortBy}
        showArchived={showArchived}
        onSortChange={(value: SortKey) => setSettings({ sortBy: value })}
        onToggleArchived={() => setSettings({ showArchived: !showArchived })}
        onOpen={openDetail}
        onDelete={deletePurchase}
        onAdd={openCreate}
        deltaMap={deltaMap}
      />
    </>
  );
}
