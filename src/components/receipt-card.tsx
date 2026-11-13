"use client";

import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AnimatedNumber } from "@/components/animated-number";
import { formatDateCN, formatDateShort } from "@/lib/date";
import { formatExpiredAt } from "@/lib/expiry";
import { getIcon } from "@/lib/icons";
import { costMetaphor, formatCents, type PurchaseStat } from "@/lib/money";
import { cn } from "@/lib/utils";

export function ReceiptCard({
  stat,
  index,
  fromDailyCostCents,
  onOpen,
  onDelete,
  onClickable = true,
}: {
  stat: PurchaseStat;
  index: number;
  fromDailyCostCents?: number;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onClickable?: boolean;
}) {
  const dragged = useRef(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { purchase, daysOwned, dailyCostCents } = stat;
  const icon = getIcon(purchase.iconKey);
  const expiry = purchase.expiry;
  const archived = Boolean(expiry);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, rotate: index % 2 === 0 ? -0.6 : 0.6 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      exit={{ opacity: 0, x: -60, scale: 0.94, transition: { duration: 0.22 } }}
      transition={{ type: "spring", stiffness: 260, damping: 26, delay: Math.min(index * 0.045, 0.32) }}
      className="relative"
    >
      <div className="absolute inset-0 flex items-center justify-end rounded-2xl bg-destructive pr-6 text-destructive-foreground">
        <Trash2 className="h-5 w-5" />
        <span className="ml-2 text-xs font-semibold">撕下</span>
      </div>

      <motion.div
        drag="x"
        dragConstraints={{ left: -110, right: 0 }}
        dragElastic={0.16}
        dragSnapToOrigin
        onDragStart={() => {
          dragged.current = true;
        }}
        onDragEnd={(_, info) => {
          if (info.offset.x < -88) setConfirmOpen(true);
          window.setTimeout(() => {
            dragged.current = false;
          }, 180);
        }}
        whileTap={{ scale: 0.985 }}
        onClick={() => {
          if (dragged.current || !onClickable) return;
          onOpen(purchase.id);
        }}
        role={onClickable ? "button" : undefined}
        tabIndex={onClickable ? 0 : undefined}
        onKeyDown={(event) => {
          if (onClickable && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            onOpen(purchase.id);
          }
        }}
        aria-label={onClickable ? `查看 ${purchase.name} 的${archived ? "已失效" : ""}小票` : undefined}
        className={cn(
          "receipt-paper relative rounded-2xl border border-border/70 p-4 shadow-receipt",
          archived && "receipt-voided",
          onClickable && "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
      >
        <span className="receipt-notch -left-[8px]" aria-hidden="true" />
        <span className="receipt-notch -right-[8px]" aria-hidden="true" />
        <div className="receipt-edge" aria-hidden="true" />

        {archived ? (
          <div
            className="void-stamp animate-void-stamp absolute right-2 top-3 z-10 rounded-full px-3 py-1.5 text-[11px] font-bold"
            aria-hidden="true"
          >
            已失效
          </div>
        ) : null}

        <div className="relative flex items-start gap-3">
          <div
            className="icon-candy flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-[30px] leading-none"
            style={{ background: icon.gradient }}
            aria-hidden="true"
          >
            {purchase.iconImageDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={purchase.iconImageDataUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span>{icon.emoji}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className={cn("truncate text-base font-bold tracking-tight", archived && "pr-16")}>
                {purchase.name}
              </h3>
              <span className="shrink-0 text-[11px] tabular text-muted-foreground">
                {formatDateShort(purchase.purchasedAt)}
              </span>
            </div>
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
              {archived ? `花了 ${formatCents(purchase.priceCents)} · ${expiry?.reason}` : `花了 ${formatCents(purchase.priceCents)} · ${costMetaphor(dailyCostCents)}`}
            </p>
          </div>
        </div>

        <div className="relative mt-3 dashed-rule" />

        {archived && expiry ? (
          <div className="relative mt-2.5 rounded-xl bg-background/45 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
            <div className="truncate font-medium text-foreground/80">原因 · {expiry.reason}</div>
            <div className="mt-0.5">
              失效于 {formatDateCN(expiry.expiredOn)} · 记录 {formatExpiredAt(expiry.expiredAt)}
            </div>
          </div>
        ) : null}

        <div className="relative mt-3 flex items-end justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="day-stamp flex h-[58px] w-[58px] shrink-0 animate-stamp-in flex-col items-center justify-center rounded-full">
              <span className={cn("text-lg font-bold leading-none tabular", archived ? "text-muted-foreground" : "text-primary")}>
                {daysOwned}
              </span>
              <span className="mt-0.5 text-[9px] font-medium text-muted-foreground">天</span>
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">{archived ? "共陪伴" : "已经陪伴"}</div>
              <div className="text-xs font-semibold">{archived ? "数字已定格" : "每天都在回本"}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-muted-foreground">{archived ? "定格日均" : "平均每天"}</div>
            {archived ? (
              <span className="tabular text-[26px] font-bold leading-tight tracking-tight">
                {formatCents(dailyCostCents)}
              </span>
            ) : (
              <AnimatedNumber
                value={dailyCostCents}
                from={fromDailyCostCents}
                className="text-[26px] font-bold leading-tight tracking-tight text-foreground"
              />
            )}
          </div>
        </div>
      </motion.div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>撕下这张小票？</AlertDialogTitle>
            <AlertDialogDescription>
              撕下后可在提示里撤销，放回小票墙。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>留着</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => onDelete(purchase.id)}
            >
              撕下
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
