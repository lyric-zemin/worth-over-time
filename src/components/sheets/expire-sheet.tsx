"use client";

import { Archive, Check, Clock3 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AnimatedNumber, integerFormatter } from "@/components/shared/animated-number";
import { Button } from "@/components/ui/button";
import { DateWheel } from "@/components/ui/date-wheel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { dateKeyToDate, formatDateCN, toDateKey } from "@/lib/date";
import {
  EXPIRY_REASONS,
  MAX_REASON_LENGTH,
  buildExpiry,
  expiryPreview,
  isValidExpiryDate,
  normalizeReason,
} from "@/lib/expiry";
import { getIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import type { ExpiryInfo, Purchase } from "@/types/ledger";

export function ExpireSheet({
  purchase,
  onClose,
  onConfirm,
}: {
  purchase: Purchase | null;
  onClose: () => void;
  onConfirm: (expiry: ExpiryInfo) => void;
}) {
  const [date, setDate] = useState<Date>(() => new Date());
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!purchase) return;
    setDate(new Date());
    setReason("");
    setError("");
  }, [purchase?.id]);

  const dateKeyValue = toDateKey(date);
  const validDate = purchase ? isValidExpiryDate(dateKeyValue, purchase.purchasedAt) : false;
  const preview = useMemo(
    () => (purchase && validDate ? expiryPreview(purchase, dateKeyValue) : null),
    [purchase, dateKeyValue, validDate],
  );

  const handleConfirm = () => {
    const text = normalizeReason(reason);
    if (!text) {
      setError("写一句失效原因吧");
      return;
    }
    if (!purchase || !validDate) {
      setError("失效日期要在购买日和今天之间");
      return;
    }
    onConfirm(buildExpiry(purchase, dateKeyValue, text));
  };

  return (
    <Sheet open={Boolean(purchase)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="max-h-[94dvh]">
        {purchase ? (
          <>
            <div className="px-5 pb-1 pt-5">
              <SheetTitle className="pr-12 text-xl font-bold tracking-tight">给这张小票盖章</SheetTitle>
              <SheetDescription className="mt-1 text-xs text-muted-foreground">
                盖章后，天数与日均成本定格在这一天
              </SheetDescription>
            </div>

            <div className="no-scrollbar flex-1 space-y-5 overflow-y-auto px-5 pb-4 pt-3">
              <div className="flex items-center gap-3 rounded-2xl bg-secondary/55 p-3">
                <div
                  className="icon-candy flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl text-2xl"
                  style={{ background: getIcon(purchase.iconKey).gradient }}
                  aria-hidden="true"
                >
                  {purchase.iconImageDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={purchase.iconImageDataUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    getIcon(purchase.iconKey).emoji
                  )}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{purchase.name}</div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    {formatDateCN(purchase.purchasedAt)} 买下 · 花了 ¥{(purchase.priceCents / 100).toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>哪天起不再陪伴</Label>
                  <span className="text-[11px] text-muted-foreground">{formatDateCN(dateKeyValue)}</span>
                </div>
                <div className="rounded-2xl border border-border/70 bg-card/60 p-2">
                  <DateWheel
                    value={date}
                    minDate={dateKeyToDate(purchase.purchasedAt)}
                    maxDate={new Date()}
                    onChange={setDate}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">可选购买日到今天的任意一天</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="expire-reason">发生了什么</Label>
                  <span className="text-[11px] tabular text-muted-foreground">
                    {reason.length} / {MAX_REASON_LENGTH}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {EXPIRY_REASONS.map((label) => (
                    <button
                      key={label}
                      type="button"
                      aria-pressed={reason === label}
                      onClick={() => {
                        setReason(label);
                        setError("");
                      }}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-medium transition-all active:scale-95",
                        reason === label
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card/70 text-muted-foreground hover:bg-secondary",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <Input
                  id="expire-reason"
                  value={reason}
                  maxLength={MAX_REASON_LENGTH}
                  autoComplete="off"
                  placeholder="比如：进水之后开不了机了"
                  className="border-0 bg-card/80"
                  onChange={(event) => {
                    setReason(event.target.value);
                    setError("");
                  }}
                />
              </div>

              <div className="rounded-2xl border bg-card/70 p-4">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                  <Archive className="h-3.5 w-3.5" /> 盖章后会定格在
                </div>
                {preview ? (
                  <div className="mt-2 flex items-end justify-between gap-3">
                    <div>
                      <div className="text-[11px] text-muted-foreground">共陪伴</div>
                      <div className="flex items-baseline gap-1">
                        <AnimatedNumber
                          value={preview.daysOwned}
                          format={integerFormatter}
                          className="text-2xl font-bold leading-tight"
                        />
                        <span className="text-xs text-muted-foreground">天</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-muted-foreground">定格日均</div>
                      <AnimatedNumber value={preview.dailyCostCents} className="text-2xl font-bold leading-tight" />
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-destructive">请选择有效的失效日期</p>
                )}
                <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                  定格后不再随日期变化
                </p>
              </div>

              <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Clock3 className="h-3.5 w-3.5" /> 操作时间自动记下，显示到分钟
              </p>

              {error ? (
                <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                  {error}
                </p>
              ) : null}
            </div>

            <div className="border-t border-border/70 bg-background/95 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
              <Button size="lg" className="w-full" onClick={handleConfirm}>
                <Check className="h-4 w-4" /> 盖上失效章
              </Button>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
