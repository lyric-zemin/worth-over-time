"use client";

import * as React from "react";

const ITEM_H = 36;
const WHEEL_H = 180;
const PAD = (WHEEL_H - ITEM_H) / 2;

export interface DateWheelProps {
  value: Date;
  onChange: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function clampDate(date: Date, min: Date, max: Date): Date {
  const t = date.getTime();
  const minTime = new Date(min.getFullYear(), min.getMonth(), min.getDate()).getTime();
  const maxTime = new Date(max.getFullYear(), max.getMonth(), max.getDate()).getTime();
  if (t < minTime) return new Date(min.getFullYear(), min.getMonth(), min.getDate());
  if (t > maxTime) return new Date(max.getFullYear(), max.getMonth(), max.getDate());
  return date;
}

interface ColumnItem {
  value: number;
  label: string;
}

function WheelColumn({
  items,
  selected,
  onSelect,
  ariaLabel,
}: {
  items: ColumnItem[];
  selected: number;
  onSelect: (value: number) => void;
  ariaLabel: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const raf = React.useRef<number | null>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const idx = items.findIndex((item) => item.value === selected);
    if (idx >= 0) el.scrollTop = idx * ITEM_H;
  }, [selected, items]);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const el = event.currentTarget;
    const top = el.scrollTop;
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      const idx = Math.round(top / ITEM_H);
      const item = items[idx];
      if (item && item.value !== selected) onSelect(item.value);
    });
  };

  return (
    <div
      ref={ref}
      role="listbox"
      aria-label={ariaLabel}
      onScroll={handleScroll}
      className="no-scrollbar flex-1 overflow-y-auto"
      style={{ height: WHEEL_H, scrollSnapType: "y mandatory" }}
    >
      <div style={{ height: PAD }} aria-hidden="true" />
      {items.map((item) => (
        <div
          key={item.value}
          role="option"
          aria-selected={item.value === selected}
          style={{ height: ITEM_H, scrollSnapAlign: "center" }}
          className={`flex items-center justify-center text-lg tabular transition-colors ${
            item.value === selected ? "font-bold text-primary" : "text-muted-foreground/45"
          }`}
        >
          {item.label}
        </div>
      ))}
      <div style={{ height: PAD }} aria-hidden="true" />
    </div>
  );
}

export function DateWheel({ value, onChange, minDate, maxDate, className }: DateWheelProps) {
  const min = minDate ?? new Date(2000, 0, 1);
  const max = maxDate ?? new Date();

  const year = value.getFullYear();
  const month = value.getMonth() + 1;
  const day = value.getDate();

  const years: ColumnItem[] = [];
  for (let yy = min.getFullYear(); yy <= max.getFullYear(); yy += 1) years.push({ value: yy, label: `${yy}` });
  const months: ColumnItem[] = Array.from({ length: 12 }, (_, i) => i + 1)
    .filter((mm) => {
      if (year > min.getFullYear() && year < max.getFullYear()) return true;
      if (year === min.getFullYear() && mm < min.getMonth() + 1) return false;
      if (year === max.getFullYear() && mm > max.getMonth() + 1) return false;
      return true;
    })
    .map((mm) => ({ value: mm, label: `${mm} 月` }));

  const dayCount = daysInMonth(year, month);
  const days: ColumnItem[] = Array.from({ length: dayCount }, (_, i) => i + 1)
    .filter((dd) => {
      const candidate = new Date(year, month - 1, dd);
      return candidate >= new Date(min.getFullYear(), min.getMonth(), min.getDate()) &&
        candidate <= new Date(max.getFullYear(), max.getMonth(), max.getDate());
    })
    .map((dd) => ({ value: dd, label: `${dd} 日` }));

  const handleYear = (yy: number) => {
    const next = clampDate(new Date(yy, month - 1, Math.min(day, daysInMonth(yy, month))), min, max);
    onChange(next);
  };
  const handleMonth = (mm: number) => {
    const next = clampDate(new Date(year, mm - 1, Math.min(day, daysInMonth(year, mm))), min, max);
    onChange(next);
  };
  const handleDay = (dd: number) => {
    onChange(clampDate(new Date(year, month - 1, dd), min, max));
  };

  return (
    <div className={className}>
      <div className="flex gap-1">
        <WheelColumn items={years} selected={year} onSelect={handleYear} ariaLabel="年" />
        <WheelColumn items={months} selected={month} onSelect={handleMonth} ariaLabel="月" />
        <WheelColumn items={days} selected={day} onSelect={handleDay} ariaLabel="日" />
      </div>
    </div>
  );
}
