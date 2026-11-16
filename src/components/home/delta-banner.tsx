"use client";

import { motion } from "framer-motion";
import { CalendarClock, Sparkles, TrendingDown } from "lucide-react";
import { AnimatedNumber, integerFormatter } from "@/components/shared/animated-number";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { DeltaSummary } from "@/types/ledger";

function lastViewedLabel(timestamp?: number) {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleString("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DeltaBanner({
  delta,
  activeCount,
  archivedCount,
  onStart,
}: {
  delta: DeltaSummary | null;
  activeCount: number;
  archivedCount: number;
  onStart: () => void;
}) {
  if (activeCount === 0 && archivedCount > 0) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border bg-card/80 p-5 shadow-soft backdrop-blur"
      >
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <CalendarClock className="h-4 w-4 text-primary" />
          {delta?.lastViewedAt ? `上次查看 · ${lastViewedLabel(delta.lastViewedAt)}` : "已失效 · 归档"}
        </div>
        <h2 className="mt-2 text-xl font-bold tracking-tight">活跃的小票都收进归档了</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          旧小票已定格，记一笔新的，时间重新替你省钱。
        </p>
        <Button size="sm" className="mt-4" onClick={onStart}>
          <Sparkles className="h-4 w-4" /> 记一笔新的
        </Button>
      </motion.section>
    );
  }

  if (!delta || delta.isFirstVisit) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/15 via-card to-secondary p-5 shadow-soft"
      >
        <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-primary/15 blur-2xl" />
        <Badge className="bg-card/70">第一叠小票</Badge>
        <h2 className="mt-3 text-[22px] font-bold leading-snug tracking-tight">
          东西会旧，<br />但每天的成本会变轻。
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          记下第一笔，明天回来就能看见时间省下的钱。
        </p>
        <Button size="sm" className="mt-4" onClick={onStart}>
          <Sparkles className="h-4 w-4" /> 记下第一笔
        </Button>
      </motion.section>
    );
  }

  if (!delta.hasChange) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border bg-card/80 p-5 shadow-soft backdrop-blur"
      >
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <CalendarClock className="h-4 w-4 text-primary" /> 上次查看 · {lastViewedLabel(delta.lastViewedAt)}
        </div>
        <h2 className="mt-2 text-xl font-bold tracking-tight">
          {delta.elapsedDays > 0 ? `隔了 ${delta.elapsedDays} 天，还没有可比的小票` : "今天的小票没有变化"}
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          {delta.elapsedDays > 0 && delta.newPurchaseCount > 0
            ? `期间记了 ${delta.newPurchaseCount} 笔，明天起数字往下走。`
            : "天数按日历更新，明天打开数字会再降一点。"}
        </p>
      </motion.section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 240, damping: 24 }}
      aria-live="polite"
      className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/15 via-card to-secondary p-5 shadow-soft"
    >
      <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-primary/20 blur-2xl" />
      <div
        className="pointer-events-none absolute -bottom-16 left-6 h-28 w-28 rounded-full blur-2xl"
        style={{ background: "hsl(var(--glow-2) / .18)" }}
      />

      <div className="relative flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">上次查看之后</span>
        <Badge variant="outline" className="bg-card/60">
          隔了 {delta.elapsedDays} 天
        </Badge>
      </div>

      <div className="relative mt-3 flex items-baseline gap-2">
        <span className="text-sm font-medium text-muted-foreground">又陪了你</span>
        <AnimatedNumber
          value={delta.daysGained}
          from={0}
          format={integerFormatter}
          className="text-[38px] font-bold leading-none text-foreground"
        />
        <span className="text-sm font-medium text-muted-foreground">天</span>
      </div>

      <div className="relative mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-card/75 p-3 shadow-sm backdrop-blur">
          <div className="text-[11px] font-medium text-muted-foreground">这些小票每天成本</div>
          <AnimatedNumber
            value={delta.currentDailyCostCents}
            from={delta.previousDailyCostCents}
            className="mt-1 text-xl font-bold text-foreground"
          />
        </div>
        <div className="rounded-2xl bg-positive/10 p-3 shadow-sm">
          <div className="flex items-center gap-1 text-[11px] font-medium text-positive">
            <TrendingDown className="h-3 w-3" /> 每天省下
          </div>
          <AnimatedNumber
            value={delta.dailyCostSavedCents}
            from={0}
            className="mt-1 text-xl font-bold text-positive"
          />
        </div>
      </div>

      <p className="relative mt-3 text-[11px] leading-relaxed text-muted-foreground">
        {delta.newPurchaseCount > 0 ? `期间记了 ${delta.newPurchaseCount} 笔 · ` : ""}
        上次查看 {lastViewedLabel(delta.lastViewedAt)} · 数字已滚到今天
      </p>
    </motion.section>
  );
}
