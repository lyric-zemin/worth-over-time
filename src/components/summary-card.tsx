"use client";

import { motion } from "framer-motion";
import { Coins, Layers3, Wallet } from "lucide-react";
import { AnimatedNumber, integerFormatter } from "@/components/animated-number";

export function SummaryCard({
  totalCents,
  totalDailyCostCents,
  count,
  archivedCount,
}: {
  totalCents: number;
  totalDailyCostCents: number;
  count: number;
  archivedCount: number;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08, type: "spring", stiffness: 220, damping: 24 }}
      className="relative overflow-hidden rounded-3xl border bg-card p-4 shadow-soft"
    >
      <div
        className="absolute inset-x-0 top-0 h-1"
        style={{ background: "linear-gradient(90deg,hsl(var(--primary)),hsl(var(--glow-2)),hsl(var(--positive)))" }}
      />
      <div className="flex items-center justify-between px-1 pb-3">
        <h2 className="text-sm font-semibold">这叠小票的总账</h2>
        <span className="text-[11px] text-muted-foreground">只算有效小票</span>
      </div>
      <div className="grid grid-cols-3 divide-x divide-border rounded-2xl bg-secondary/55 py-3">
        <div className="px-2 text-center">
          <div className="mx-auto flex w-fit items-center gap-1 text-[11px] text-muted-foreground">
            <Wallet className="h-3 w-3" /> 总投入
          </div>
          <AnimatedNumber value={totalCents} className="mt-1.5 text-base font-bold" />
        </div>
        <div className="px-2 text-center">
          <div className="mx-auto flex w-fit items-center gap-1 text-[11px] text-muted-foreground">
            <Coins className="h-3 w-3" /> 每天合计
          </div>
          <AnimatedNumber value={totalDailyCostCents} className="mt-1.5 text-base font-bold text-primary" />
        </div>
        <div className="px-2 text-center">
          <div className="mx-auto flex w-fit items-center gap-1 text-[11px] text-muted-foreground">
            <Layers3 className="h-3 w-3" /> 件数
          </div>
          <AnimatedNumber value={count} format={integerFormatter} className="mt-1.5 text-base font-bold" />
        </div>
      </div>
      {archivedCount > 0 ? (
        <p className="mt-2 px-1 text-[11px] text-muted-foreground">
          另有 {archivedCount} 张已失效，收在下方的归档区
        </p>
      ) : null}
    </motion.section>
  );
}
