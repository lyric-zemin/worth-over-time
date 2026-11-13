"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowDownWideNarrow, Archive, ReceiptText, Sparkles } from "lucide-react";
import { useMemo } from "react";
import { ArchivedSection } from "@/components/archived-section";
import { ReceiptCard } from "@/components/receipt-card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PurchaseStat } from "@/lib/money";
import { sortPurchaseStats } from "@/lib/sort";
import type { SortKey } from "@/types/ledger";

const SORT_LABELS: Record<SortKey, string> = {
  recent: "最近记的",
  oldest: "买得最早",
  "daily-high": "每天最贵",
  "price-high": "总价最高",
};

export function ReceiptList({
  stats,
  archivedStats,
  sortBy,
  showArchived,
  onSortChange,
  onToggleArchived,
  onOpen,
  onDelete,
  onAdd,
  deltaMap,
}: {
  stats: PurchaseStat[];
  archivedStats: PurchaseStat[];
  sortBy: SortKey;
  showArchived: boolean;
  onSortChange: (value: SortKey) => void;
  onToggleArchived: () => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  deltaMap: Map<string, number>;
}) {
  const sorted = useMemo(() => sortPurchaseStats(stats, sortBy), [stats, sortBy]);
  const allArchived = stats.length === 0 && archivedStats.length > 0;
  const empty = stats.length === 0 && archivedStats.length === 0;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <ArrowDownWideNarrow className="h-3.5 w-3.5" />
          {stats.length} 张有效小票
        </div>
        <Select value={sortBy} onValueChange={(value) => onSortChange(value as SortKey)}>
          <SelectTrigger className="w-[132px]" aria-label="小票排序方式">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
              <SelectItem key={key} value={key}>
                {SORT_LABELS[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {empty ? (
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center rounded-3xl border border-dashed bg-card/60 px-6 py-12 text-center"
        >
          <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/25 to-secondary text-5xl shadow-soft">
            <span className="animate-float">🧾</span>
            <Sparkles className="absolute -right-2 -top-2 h-6 w-6 text-primary" />
          </div>
          <h3 className="mt-5 text-lg font-bold">还没有小票</h3>
          <p className="mt-2 max-w-[260px] text-sm leading-relaxed text-muted-foreground">
            记一件东西，时间和价格帮你算好。
          </p>
          <Button className="mt-5" onClick={onAdd}>
            <ReceiptText className="h-4 w-4" /> 撕一张新小票
          </Button>
        </motion.div>
      ) : null}

      {allArchived ? (
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center rounded-3xl border border-dashed bg-card/60 px-6 py-10 text-center"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-secondary text-4xl">
            <Archive className="h-9 w-9 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-bold">小票都收进归档了</h3>
          <p className="mt-2 max-w-[260px] text-sm leading-relaxed text-muted-foreground">
            旧小票已定格，再记一笔，时间重新替你省钱。
          </p>
          <Button className="mt-5" onClick={onAdd}>
            <ReceiptText className="h-4 w-4" /> 记一笔新的
          </Button>
        </motion.div>
      ) : null}

      {stats.length > 0 ? (
        <>
          <div className="space-y-4 pb-2">
            <AnimatePresence initial={false} mode="popLayout">
              {sorted.map((stat, index) => (
                <ReceiptCard
                  key={stat.purchase.id}
                  stat={stat}
                  index={index}
                  fromDailyCostCents={deltaMap.get(stat.purchase.id)}
                  onOpen={onOpen}
                  onDelete={onDelete}
                />
              ))}
            </AnimatePresence>
          </div>
          <p className="px-1 pb-1 text-center text-[11px] text-muted-foreground">
            左滑撕下，点开看陪伴天数
          </p>
        </>
      ) : null}

      <ArchivedSection
        stats={archivedStats}
        sortBy={sortBy}
        showArchived={showArchived}
        onToggle={onToggleArchived}
        onOpen={onOpen}
        onDelete={onDelete}
      />
    </section>
  );
}
