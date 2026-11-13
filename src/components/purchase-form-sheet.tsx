"use client";

import { CalendarDays, Check, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { IconPicker, type IconChoice } from "@/components/icon-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { dateKeyToDate, formatDateCN, isFutureDateKey, toDateKey } from "@/lib/date";
import { haptic } from "@/lib/feedback";
import { getIcon, matchIconByName } from "@/lib/icons";
import { formatCents, parsePriceToCents } from "@/lib/money";
import { useLedgerStore } from "@/store/use-ledger-store";
import type { Purchase } from "@/types/ledger";

const EMPTY_CHOICE: IconChoice = { iconKey: "general" };

export function PurchaseFormSheet({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Purchase | null;
}) {
  const addPurchase = useLedgerStore((state) => state.addPurchase);
  const updatePurchase = useLedgerStore((state) => state.updatePurchase);
  const hapticsEnabled = useLedgerStore((state) => state.settings.haptics);

  const [name, setName] = useState("");
  const [priceText, setPriceText] = useState("");
  const [date, setDate] = useState<Date>(() => new Date());
  const [choice, setChoice] = useState<IconChoice>(EMPTY_CHOICE);
  const [manualIcon, setManualIcon] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setName(editing.name);
      setPriceText(formatCents(editing.priceCents, false));
      setDate(dateKeyToDate(editing.purchasedAt));
      setChoice({ iconKey: editing.iconKey, iconImageDataUrl: editing.iconImageDataUrl });
      setManualIcon(true);
    } else {
      setName("");
      setPriceText("");
      setDate(new Date());
      setChoice(EMPTY_CHOICE);
      setManualIcon(false);
    }
    setError("");
  }, [open, editing]);

  useEffect(() => {
    if (manualIcon) return;
    setChoice((previous) => ({ ...previous, iconKey: matchIconByName(name).key }));
  }, [name, manualIcon]);

  const preview = getIcon(choice.iconKey);
  const dateKeyValue = toDateKey(date);

  const handleSave = () => {
    const trimmed = name.trim().slice(0, 40);
    const priceCents = parsePriceToCents(priceText);
    if (!trimmed) {
      setError("给这件东西起个名字吧");
      return;
    }
    if (priceCents === null) {
      setError("金额请填到分，例如 128.50");
      return;
    }
    if (isFutureDateKey(dateKeyValue)) {
      setError("还没买的东西，等买回来再记");
      return;
    }
    const payload = {
      name: trimmed,
      priceCents,
      purchasedAt: dateKeyValue,
      iconKey: choice.iconKey,
      iconImageDataUrl: choice.iconImageDataUrl,
    };
    if (editing) {
      updatePurchase(editing.id, payload);
      toast.success("小票改好了");
    } else {
      addPurchase(payload);
      toast.success("小票收好了", { description: `${trimmed} · ${formatCents(priceCents)}` });
    }
    haptic(hapticsEnabled);
    setError("");
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[94dvh]">
        <div className="px-5 pb-2 pt-5">
          <SheetTitle className="pr-12 text-xl font-bold tracking-tight">
            {editing ? "改一改这张小票" : "撕一张新小票"}
          </SheetTitle>
          <SheetDescription className="mt-1 text-xs text-muted-foreground">
            写下名字、花了多少、哪天买的，剩下的交给时间
          </SheetDescription>
        </div>

        <div className="no-scrollbar flex-1 space-y-5 overflow-y-auto px-5 pb-4">
          <div className="flex items-center gap-3 rounded-2xl bg-secondary/55 p-3">
            <div
              className="icon-candy flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl text-2xl"
              style={{ background: preview.gradient }}
              aria-hidden="true"
            >
              {choice.iconImageDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={choice.iconImageDataUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                preview.emoji
              )}
            </div>
            <div className="min-w-0 flex-1">
              <Label htmlFor="purchase-name">买了什么</Label>
              <Input
                id="purchase-name"
                value={name}
                maxLength={40}
                autoComplete="off"
                placeholder="比如：通勤用的降噪耳机"
                className="mt-1 border-0 bg-card/80"
                onChange={(event) => setName(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="purchase-price">花了多少</Label>
            <div className="flex items-center gap-2 rounded-2xl border border-input bg-card/80 px-4 focus-within:ring-2 focus-within:ring-ring">
              <span className="text-2xl font-bold text-primary">¥</span>
              <input
                id="purchase-price"
                type="text"
                inputMode="decimal"
                value={priceText}
                maxLength={14}
                placeholder="0.00"
                autoComplete="off"
                className="h-14 w-full border-0 bg-transparent text-2xl font-bold tabular outline-none placeholder:text-muted-foreground/40 focus-visible:outline-none"
                onChange={(event) => setPriceText(event.target.value)}
              />
              <span className="shrink-0 text-[11px] text-muted-foreground">精确到分</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>哪天买的</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start gap-2 rounded-2xl" type="button">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">{formatDateCN(dateKeyValue)}</span>
                  <span className="ml-auto text-[11px] text-muted-foreground">修改</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[320px]" align="start">
                <Calendar
                  selected={date}
                  disabled={(day) => isFutureDateKey(toDateKey(day))}
                  onSelect={(next) => next && setDate(next)}
                />
                <PopoverClose asChild>
                  <Button size="sm" className="mt-3 w-full" type="button" onClick={() => setDate(new Date())}>
                    <Check className="h-4 w-4" /> 就今天
                  </Button>
                </PopoverClose>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Label>小票上的图标</Label>
              <span className="flex items-center gap-1 text-[11px] text-primary">
                <Sparkles className="h-3 w-3" /> 会跟着名字变
              </span>
            </div>
            <IconPicker
              value={choice}
              onChange={(next) => {
                setManualIcon(true);
                setChoice(next);
              }}
            />
          </div>

          {error ? (
            <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
              {error}
            </p>
          ) : null}
        </div>

        <div className="border-t border-border/70 bg-background/95 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <Button size="lg" className="w-full" onClick={handleSave}>
            <Check className="h-4 w-4" /> {editing ? "保存修改" : "收进小票夹"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
