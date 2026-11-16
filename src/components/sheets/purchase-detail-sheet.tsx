"use client";

import { motion } from "framer-motion";
import { Archive, CalendarDays, Coins, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import { AnimatedNumber, integerFormatter } from "@/components/shared/animated-number";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { formatDateCN } from "@/lib/date";
import { formatExpiredAt } from "@/lib/expiry";
import { getIcon } from "@/lib/icons";
import { costMetaphor, formatCents, type PurchaseStat } from "@/lib/money";

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function PurchaseDetailSheet({
  stat,
  fromDailyCostCents,
  onClose,
  onEdit,
  onExpire,
  onRestore,
  onDelete,
}: {
  stat: PurchaseStat | null;
  fromDailyCostCents?: number;
  onClose: () => void;
  onEdit: () => void;
  onExpire: () => void;
  onRestore: () => void;
  onDelete: () => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const expiry = stat?.purchase.expiry;
  const archived = Boolean(expiry);

  const rows = stat
    ? archived && expiry
      ? [
          { label: "买下那天", value: formatDateCN(stat.purchase.purchasedAt) },
          { label: "一次花了", value: formatCents(stat.purchase.priceCents) },
          { label: "失效日期", value: formatDateCN(expiry.expiredOn) },
          { label: "失效原因", value: expiry.reason },
          { label: "共陪伴", value: `${stat.daysOwned} 天` },
          { label: "定格日均", value: `${formatCents(stat.dailyCostCents)} / 天` },
          { label: "记录时间", value: formatExpiredAt(expiry.expiredAt) },
        ]
      : [
          { label: "买下那天", value: formatDateCN(stat.purchase.purchasedAt) },
          { label: "一次花了", value: formatCents(stat.purchase.priceCents) },
          { label: "已经陪伴", value: `${stat.daysOwned} 天` },
          { label: "累计分摊", value: `${formatCents(stat.dailyCostCents)} / 天` },
        ]
    : [];

  return (
    <Sheet open={Boolean(stat)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="max-h-[92dvh]">
        {stat ? (
          <>
            <div className="px-5 pb-1 pt-5">
              <SheetTitle className="pr-12 text-lg font-bold">这张小票的故事</SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                {archived ? "已盖章定格，数字不再变化" : "时间越久，每天成本越低"}
              </SheetDescription>
            </div>

            <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-4">
              <div className="flex items-center gap-3 pt-3">
                <div
                  className="icon-candy flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-4xl"
                  style={{ background: getIcon(stat.purchase.iconKey).gradient }}
                  aria-hidden="true"
                >
                  {stat.purchase.iconImageDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={stat.purchase.iconImageDataUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    getIcon(stat.purchase.iconKey).emoji
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-xl font-bold tracking-tight">{stat.purchase.name}</h2>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" /> {formatDateCN(stat.purchase.purchasedAt)} 买下
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-5 rounded-3xl border bg-card p-4 shadow-soft">
                <div className="relative h-[120px] w-[120px] shrink-0">
                  <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true">
                    <circle cx="60" cy="60" r={RADIUS} fill="none" stroke="hsl(var(--secondary))" strokeWidth="10" />
                    <motion.circle
                      cx="60"
                      cy="60"
                      r={RADIUS}
                      fill="none"
                      stroke={archived ? "hsl(var(--muted-foreground))" : "hsl(var(--primary))"}
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={CIRCUMFERENCE}
                      initial={{ strokeDashoffset: CIRCUMFERENCE }}
                      animate={{ strokeDashoffset: CIRCUMFERENCE * (1 - Math.min(1, stat.daysOwned / 365)) }}
                      transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <AnimatedNumber
                      value={stat.daysOwned}
                      format={integerFormatter}
                      className="text-3xl font-bold leading-none"
                    />
                    <span className="mt-1 text-[11px] text-muted-foreground">
                      {archived ? "共陪伴 / 天" : "已经陪伴 / 天"}
                    </span>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-medium text-muted-foreground">
                    {archived ? "定格日均成本" : "平均每天成本"}
                  </div>
                  {archived ? (
                    <span className="tabular mt-1 block text-[30px] font-bold leading-tight">
                      {formatCents(stat.dailyCostCents)}
                    </span>
                  ) : (
                    <AnimatedNumber
                      value={stat.dailyCostCents}
                      from={fromDailyCostCents}
                      className="mt-1 block text-[30px] font-bold leading-tight text-primary"
                    />
                  )}
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                    {archived ? "盖章那天的最终值，之后不再变化" : costMetaphor(stat.dailyCostCents)}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-0 rounded-2xl border bg-card/70 p-4">
                {rows.map((row, index, all) => (
                  <div key={row.label} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <span className={`mt-1 h-2 w-2 rounded-full ${index === 0 ? "bg-primary" : "bg-border"}`} />
                      {index < all.length - 1 ? <span className="my-1 h-8 w-px bg-border" /> : null}
                    </div>
                    <div className="flex flex-1 items-center justify-between gap-2 py-1">
                      <span className="shrink-0 text-xs text-muted-foreground">{row.label}</span>
                      <span className="truncate text-right text-xs font-semibold tabular">{row.value}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-start gap-2 rounded-2xl bg-secondary/60 p-3 text-xs leading-relaxed text-muted-foreground">
                {archived ? (
                  <Archive className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <Coins className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                )}
                {archived
                  ? "失效小票不参与总账与回顾，可在下方恢复有效。"
                  : "按总价 ÷ 已购天数计算，购买当天算第 1 天。"}
              </div>
            </div>

            <div className="flex gap-2 border-t border-border/70 bg-background/95 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
              {archived ? (
                <Button className="flex-1" onClick={onRestore}>
                  <RotateCcw className="h-4 w-4" /> 恢复有效
                </Button>
              ) : (
                <>
                  <Button variant="outline" size="sm" className="flex-1 px-2" onClick={onEdit}>
                    <Pencil className="h-4 w-4" /> 改一改
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 px-2" onClick={onExpire}>
                    <Archive className="h-4 w-4" /> 标记失效
                  </Button>
                </>
              )}
              <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 px-3 text-destructive"
                    aria-label="撕下小票"
                  >
                    <Trash2 className="h-4 w-4" /> 撕下
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>撕下这张小票？</AlertDialogTitle>
                    <AlertDialogDescription>
                      「{stat.purchase.name}」将从这台设备移除，可撤销一次。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>留着</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:brightness-110"
                      onClick={() => {
                        setConfirmOpen(false);
                        onDelete();
                      }}
                    >
                      撕下
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
