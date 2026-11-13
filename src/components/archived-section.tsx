"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Archive, ChevronDown } from "lucide-react";
import { useMemo } from "react";
import { ReceiptCard } from "@/components/receipt-card";
import { Badge } from "@/components/ui/badge";
import type { PurchaseStat } from "@/lib/money";
import { sortPurchaseStats } from "@/lib/sort";
import { cn } from "@/lib/utils";
import type { SortKey } from "@/types/ledger";

export function ArchivedSection({
  stats,
  sortBy,
  showArchived,
  onToggle,
  onOpen,
  onDelete,
}: {
  stats: PurchaseStat[];
  sortBy: SortKey;
  showArchived: boolean;
  onToggle: () => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const sorted = useMemo(() => sortPurchaseStats(stats, sortBy), [stats, sortBy]);
  if (!stats.length) return null;

  return (
    <section className="mt-2 space-y-3">
      <button
        type="button"
        aria-expanded={showArchived}
        aria-controls="archived-receipts"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 rounded-2xl border border-dashed bg-card/50 px-4 py-3 text-left transition-colors hover:bg-secondary/60 active:scale-[0.99]"
      >
        <span className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <Archive className="h-4 w-4" /> 已失效 · 归档
          <Badge variant="outline" className="ml-0.5">{stats.length} 张</Badge>
        </span>
        <span className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
          {showArchived ? "收起" : "展开"}
          <ChevronDown className={cn("h-4 w-4 transition-transform", showArchived && "rotate-180")} />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {showArchived ? (
          <motion.div
            id="archived-receipts"
            key="archived-list"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-4 pt-1">
              {sorted.map((stat, index) => (
                <ReceiptCard
                  key={stat.purchase.id}
                  stat={stat}
                  index={index}
                  onOpen={onOpen}
                  onDelete={onDelete}
                />
              ))}
            </div>
            <p className="pb-1 pt-3 text-center text-[11px] text-muted-foreground">
              这些小票的数字已经定格，不会再随时间变化
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
