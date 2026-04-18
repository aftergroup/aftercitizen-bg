/**
 * Bulgarian-localized date picker.
 *
 * Stores its value as ISO `YYYY-MM-DD` (what Baserow expects) and
 * displays it as `ДД.ММ.ГГГГ`. Month and weekday names are in
 * Bulgarian; the week starts on Monday.
 */
import * as React from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const MONTHS_BG = [
  "Януари", "Февруари", "Март", "Април", "Май", "Юни",
  "Юли", "Август", "Септември", "Октомври", "Ноември", "Декември",
];

const WEEKDAYS_BG = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

function pad(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

function toIso(y: number, m: number, d: number): string {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

function fromIso(value: string | undefined): { y: number; m: number; d: number } | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]) - 1;
  const d = Number(match[3]);
  if (!Number.isFinite(y) || m < 0 || m > 11 || d < 1 || d > 31) return null;
  return { y, m, d };
}

function formatDisplay(value: string | undefined): string {
  const parsed = fromIso(value);
  if (!parsed) return "";
  return `${pad(parsed.d)}.${pad(parsed.m + 1)}.${parsed.y}`;
}

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

interface Props {
  id?: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function DatePicker({
  id,
  value,
  onChange,
  placeholder = "ДД.ММ.ГГГГ",
  disabled,
  className,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const parsed = fromIso(value);
  const today = new Date();
  const [viewYear, setViewYear] = React.useState(parsed?.y ?? today.getFullYear());
  const [viewMonth, setViewMonth] = React.useState(parsed?.m ?? today.getMonth());

  React.useEffect(() => {
    if (parsed) {
      setViewYear(parsed.y);
      setViewMonth(parsed.m);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsed?.y, parsed?.m]);

  React.useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const firstDayJs = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun..6=Sat
  const leadingBlanks = (firstDayJs + 6) % 7; // Monday=0
  const totalDays = daysInMonth(viewYear, viewMonth);

  const cells: (number | null)[] = [];
  for (let i = 0; i < leadingBlanks; i += 1) cells.push(null);
  for (let d = 1; d <= totalDays; d += 1) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  function shiftMonth(delta: number) {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  }

  function pick(d: number) {
    onChange(toIso(viewYear, viewMonth, d));
    setOpen(false);
  }

  const display = formatDisplay(value);
  const isToday = (d: number) =>
    d === today.getDate() &&
    viewMonth === today.getMonth() &&
    viewYear === today.getFullYear();
  const isSelected = (d: number) =>
    !!parsed && parsed.d === d && parsed.m === viewMonth && parsed.y === viewYear;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          !display && "text-muted-foreground",
        )}
      >
        <span>{display || placeholder}</span>
        <CalendarIcon className="h-4 w-4 opacity-50" />
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Избор на дата"
          className="absolute z-50 mt-1 w-[280px] rounded-md border bg-popover p-3 text-popover-foreground shadow-md"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <button
              type="button"
              aria-label="Предишен месец"
              onClick={() => shiftMonth(-1)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-accent"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-1 text-sm font-medium">
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(Number(e.target.value))}
                className="rounded-md bg-transparent px-1 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {MONTHS_BG.map((name, i) => (
                  <option key={name} value={i}>
                    {name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={viewYear}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (Number.isFinite(v)) setViewYear(v);
                }}
                className="w-[4.5rem] rounded-md bg-transparent px-1 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <button
              type="button"
              aria-label="Следващ месец"
              onClick={() => shiftMonth(1)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-accent"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-0.5 text-center text-xs text-muted-foreground mb-1">
            {WEEKDAYS_BG.map((w) => (
              <div key={w} className="py-1 font-medium">
                {w}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((d, i) =>
              d === null ? (
                <div key={`blank-${i}`} className="h-8" />
              ) : (
                <button
                  key={d}
                  type="button"
                  onClick={() => pick(d)}
                  className={cn(
                    "h-8 w-full rounded-md text-sm hover:bg-accent hover:text-accent-foreground",
                    isSelected(d) && "bg-primary text-primary-foreground hover:bg-primary/90",
                    !isSelected(d) && isToday(d) && "ring-1 ring-primary",
                  )}
                >
                  {d}
                </button>
              ),
            )}
          </div>
          <div className="flex justify-between pt-2 mt-2 border-t text-xs">
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                onChange(toIso(now.getFullYear(), now.getMonth(), now.getDate()));
                setOpen(false);
              }}
              className="text-primary hover:underline"
            >
              Днес
            </button>
            {value && (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="text-muted-foreground hover:underline"
              >
                Изчисти
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
