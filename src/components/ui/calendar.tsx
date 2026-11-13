"use client";

import * as React from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface CalendarProps {
  mode?: "single";
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  disabled?: (date: Date) => boolean;
  className?: string;
  initialFocus?: boolean;
}

const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];

export function Calendar({ selected, onSelect, disabled, className }: CalendarProps) {
  const [month, setMonth] = React.useState(() => startOfMonth(selected ?? new Date()));

  const days = React.useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  return (
    <div className={cn("w-full select-none", className)}>
      <div className="mb-3 flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          aria-label="上一个月"
          onClick={() => setMonth((current) => addMonths(current, -1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-sm font-semibold tabular">{format(month, "yyyy 年 M 月")}</div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          aria-label="下一个月"
          onClick={() => setMonth((current) => addMonths(current, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((day) => (
          <div key={day} className="pb-1 text-[11px] font-medium text-muted-foreground">
            {day}
          </div>
        ))}
        {days.map((day) => {
          const outside = !isSameMonth(day, month);
          const blocked = outside || (disabled?.(day) ?? false);
          const active = selected ? isSameDay(day, selected) : false;
          const isToday = isSameDay(day, new Date());
          return (
            <button
              key={day.toISOString()}
              type="button"
              disabled={blocked}
              aria-label={format(day, "yyyy年M月d日")}
              aria-pressed={active}
              onClick={() => onSelect?.(day)}
              className={cn(
                "flex h-9 w-full items-center justify-center rounded-xl text-xs font-medium tabular transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                blocked && "cursor-not-allowed text-muted-foreground/35",
                !blocked && "hover:bg-secondary active:scale-95",
                isToday && !active && "text-primary font-bold",
                active && "bg-primary text-primary-foreground shadow-glow",
              )}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
