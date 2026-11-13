"use client";

import { motion } from "framer-motion";
import { CalendarRange, Crown, Hourglass, Sparkles } from "lucide-react";
import { useMemo } from "react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AnimatedNumber, integerFormatter } from "@/components/animated-number";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateShort } from "@/lib/date";
import { getIcon } from "@/lib/icons";
import { formatCents, type PurchaseStat } from "@/lib/money";

const tooltipFormatter = (value: unknown) => formatCents(Math.round(Number(value) * 100));

export function InsightsView({
  stats,
  archivedCount,
  onAdd,
}: {
  stats: PurchaseStat[];
  archivedCount: number;
  onAdd: () => void;
}) {
  const ranking = useMemo(
    () =>
      [...stats]
        .sort((a, b) => b.dailyCostCents - a.dailyCostCents)
        .slice(0, 6)
        .map((stat) => ({
          name: stat.purchase.name.length > 6 ? `${stat.purchase.name.slice(0, 6)}…` : stat.purchase.name,
          value: stat.dailyCostCents / 100,
          cents: stat.dailyCostCents,
        })),
    [stats],
  );

  const totalDays = stats.reduce((sum, stat) => sum + stat.daysOwned, 0);
  const earliest = [...stats].sort((a, b) =>
    a.purchase.purchasedAt.localeCompare(b.purchase.purchasedAt),
  )[0];

  const categories = useMemo(() => {
    const totals = new Map<string, number>();
    for (const { purchase } of stats) {
      const label = getIcon(purchase.iconKey).label;
      totals.set(label, (totals.get(label) ?? 0) + purchase.priceCents);
    }
    const all = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    const max = all[0]?.[1] ?? 1;
    return all.map(([label, cents], index) => ({
      label,
      cents,
      ratio: Math.max(8, (cents / max) * 100),
      emoji: getIcon(stats.find((s) => getIcon(s.purchase.iconKey).label === label)!.purchase.iconKey).emoji,
      rank: index,
    }));
  }, [stats]);

  if (!stats.length) {
    return (
      <div className="flex flex-col items-center rounded-3xl border border-dashed bg-card/60 px-6 py-14 text-center">
        <div className="text-5xl">📊</div>
        <h2 className="mt-4 text-lg font-bold">{archivedCount > 0 ? "有效小票都归档了" : "回顾还是空的"}</h2>
        <p className="mt-2 max-w-[260px] text-sm leading-relaxed text-muted-foreground">
          {archivedCount > 0
            ? `${archivedCount} 张已定格，不计入回顾。记一笔新的，重新看见时间的效果。`
            : "记下两三件，就能看见谁每天最费钱、哪类花得最多。"}
        </p>
        <Button className="mt-5" onClick={onAdd}>
          <Sparkles className="h-4 w-4" /> 去记一笔
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 gap-3"
      >
        <div className="rounded-3xl border bg-card p-4 shadow-soft">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Hourglass className="h-3.5 w-3.5 text-primary" /> 累计陪伴
          </div>
          <AnimatedNumber
            value={totalDays}
            format={integerFormatter}
            className="mt-1.5 text-2xl font-bold"
          />
          <div className="mt-1 text-[11px] text-muted-foreground">天 · 所有小票加起来</div>
        </div>
        <div className="rounded-3xl border bg-card p-4 shadow-soft">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <CalendarRange className="h-3.5 w-3.5 text-primary" /> 最早一笔
          </div>
          <div className="mt-1.5 truncate text-lg font-bold">{earliest.purchase.name}</div>
          <div className="mt-1 text-[11px] tabular text-muted-foreground">
            {formatDateShort(earliest.purchase.purchasedAt)} · {earliest.daysOwned} 天
          </div>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 }}
        className="rounded-3xl border bg-card p-4 shadow-soft"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">每天最费钱的小票</h3>
          <Crown className="h-4 w-4 text-warning" />
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">单位：元 / 天</p>
        <div className="mt-4" style={{ height: Math.max(120, ranking.length * 42) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ranking} layout="vertical" margin={{ top: 0, right: 12, bottom: 0, left: 0 }}>
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                width={66}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              />
              <Tooltip
                cursor={{ fill: "hsl(var(--secondary) / 0.55)" }}
                formatter={tooltipFormatter}
                contentStyle={{
                  borderRadius: 14,
                  border: "1px solid hsl(var(--border))",
                  background: "hsl(var(--card))",
                  fontSize: 12,
                }}
              />
              <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={18} animationDuration={900}>
                {ranking.map((item, index) => (
                  <Cell
                    key={item.name}
                    fill={index === 0 ? "hsl(var(--primary))" : "hsl(var(--glow-2))"}
                    opacity={index === 0 ? 1 : 0.75}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-3xl border bg-card p-4 shadow-soft"
      >
        <h3 className="text-sm font-semibold">钱都花在哪类东西上</h3>
        <p className="mt-1 text-[11px] text-muted-foreground">按类别汇总一次投入</p>
        <div className="mt-4 space-y-3">
          {categories.map((category) => (
            <div key={category.label}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-medium">
                  <span aria-hidden="true">{category.emoji}</span> {category.label}
                </span>
                <span className="tabular text-muted-foreground">{formatCents(category.cents)}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${category.ratio}%` }}
                  transition={{ delay: 0.12 + category.rank * 0.07, duration: 0.7 }}
                  className="h-full rounded-full"
                  style={{
                    background:
                      category.rank === 0
                        ? "linear-gradient(90deg,hsl(var(--primary)),hsl(var(--primary)/0.7))"
                        : "linear-gradient(90deg,hsl(var(--glow-2)),hsl(var(--glow-2)/0.55))",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.section>
    </div>
  );
}
