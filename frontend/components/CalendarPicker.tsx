"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { buildMonth, isoDate, monthLabel } from "@/lib/date";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function CalendarPicker({
  month,
  selected,
  onMonthChange,
  onSelect
}: {
  month: Date;
  selected: string;
  onMonthChange: (date: Date) => void;
  onSelect: (date: string) => void;
}) {
  const days = buildMonth(month);

  return (
    <section className="p-6 md:p-8">
      <div className="mb-7 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="Previous month">
          <ChevronLeft className="size-5" />
        </Button>
        <strong className="text-base font-bold text-calendly-navy">{monthLabel(month)}</strong>
        <Button variant="ghost" size="icon" onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="Next month">
          <ChevronRight className="size-5" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-calendly-muted">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className="mt-3 grid grid-cols-7 gap-2 text-center">
        {days.map((day) => {
          const value = isoDate(day);
          const disabled = day.getMonth() !== month.getMonth() || day < new Date(new Date().toDateString());
          return (
            <button
              key={value}
              className={cn(
                "aspect-square rounded-full text-sm font-bold text-calendly-text transition hover:bg-blue-50 hover:text-calendly-blue disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent",
                selected === value && "bg-calendly-blue text-white hover:bg-calendly-blue hover:text-white"
              )}
              disabled={disabled}
              onClick={() => onSelect(value)}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </section>
  );
}
