"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Calendar,
  CalendarPlus,
  Check,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock3,
  ExternalLink,
  HelpCircle,
  Link2,
  MailCheck,
  MapPin,
  MoreVertical,
  Plus,
  Search,
  Share2,
  Pencil,
  Repeat2,
  Trash2,
  Users,
  Eye,
  X
} from "lucide-react";
import { api, publicBookingBaseUrl, publicBookingUrl } from "@/lib/api";
import type { EventType, Schedule } from "@/types";
import { Button } from "@/components/ui/button";
import { CalendlyShimmer } from "@/components/CalendlyShimmer";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const createOptions = [
  {
    title: "One-on-one",
    meta: "1 host",
    arrow: "1 invitee",
    description: "Good for coffee chats, 1:1 interviews, etc."
  },
  {
    title: "Group",
    meta: "1 host",
    arrow: "Multiple invitees",
    description: "Webinars, online classes, etc."
  }
];

type EventDraft = {
  name: string;
  slug: string;
  color: string;
  durationMinutes: number;
  scheduleId: string;
};

const weekDays = [
  ["S", 7],
  ["M", 1],
  ["T", 2],
  ["W", 3],
  ["T", 4],
  ["F", 5],
  ["S", 6]
] as const;

const eventColors = [
  { name: "Purple", value: "#8247f5" },
  { name: "Blue", value: "#006bff" },
  { name: "Green", value: "#00a86b" },
  { name: "Orange", value: "#ff5a00" },
  { name: "Red", value: "#d92d20" },
  { name: "Teal", value: "#008c95" }
] as const;

const presetDurations = [15, 30, 45, 60] as const;

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function copyText(value: string) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

function EventRow({
  eventType,
  muted = false,
  selected = false,
  onDelete,
  onEdit,
  onSelect
}: {
  eventType: EventType;
  muted?: boolean;
  selected?: boolean;
  onDelete?: (id: string) => Promise<void>;
  onEdit?: (eventType: EventType) => void;
  onSelect?: (id: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copyEventLink() {
    await copyText(publicBookingUrl(eventType.slug));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <article
      className={cn(
        "group flex min-h-[128px] cursor-pointer items-center rounded-lg border border-[#d7e2ee] bg-white shadow-sm transition-colors hover:bg-[#f1f6ff]",
        muted && "bg-[#f5f9ff]",
        selected && "border-[#006bff] bg-[#f1f6ff] ring-1 ring-[#006bff]"
      )}
      onClick={() => onEdit?.(eventType)}
    >
      <div className="h-[128px] w-[6px] rounded-l-lg" style={{ backgroundColor: eventType.color ?? "#8247f5" }} />
      <div className="flex flex-1 items-center justify-between gap-5 px-4 sm:px-6">
        <div className="flex items-start gap-4">
          <div className="group/check relative mt-1">
            <button
              className={cn(
                "grid size-5 place-items-center rounded border-2 border-[#c5d2e0] bg-white text-white transition hover:border-[#006bff]",
                selected && "border-[#006bff] bg-[#006bff]"
              )}
              aria-label="Select event type"
              aria-pressed={selected}
              onClick={(event) => {
                event.stopPropagation();
                onSelect?.(eventType.id);
              }}
            >
              {selected && <CheckSquare className="size-4" />}
            </button>
            <span className="pointer-events-none absolute -top-12 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#0b3558] px-4 py-2 text-[14px] font-semibold text-white opacity-0 shadow-lg transition group-hover/check:opacity-100">
              make changes in bulk
            </span>
          </div>
          <div>
            <button
              className="rounded-md text-left text-[21px] font-bold tracking-normal text-[#0b3558] transition hover:bg-[#eaf3ff] hover:text-[#006bff]"
              onClick={(event) => {
                event.stopPropagation();
                onEdit?.(eventType);
              }}
            >
              {eventType.name}
            </button>
            <p className="mt-2 text-[16px] font-semibold text-[#6b83a1]">
              {formatDuration(eventType.durationMinutes)} · One-on-One
            </p>
            <p className="mt-2 text-[16px] font-semibold text-[#6b83a1]">Weekdays, 9 am - 5 pm</p>
          </div>
        </div>

        <div className="relative hidden items-center gap-5 md:flex">
          <button className="grid size-9 place-items-center rounded-full text-[#31516f] transition hover:bg-white hover:text-[#006bff] hover:shadow-sm" title={`${eventType.name} settings`} onClick={(event) => {
            event.stopPropagation();
            onEdit?.(eventType);
          }}>
            <Calendar className="size-5" />
          </button>
          <button className="grid size-9 place-items-center rounded-full text-[#31516f] transition hover:bg-white hover:text-[#006bff] hover:shadow-sm" title="Email settings" onClick={(event) => event.stopPropagation()}>
            <MailCheck className="size-5" />
          </button>
          <button className="grid size-9 place-items-center rounded-full text-[#31516f] transition hover:bg-white hover:text-[#006bff] hover:shadow-sm" title="Share" onClick={(event) => event.stopPropagation()}>
            <Share2 className="size-5" />
          </button>
          <Button
            variant="outline"
            className="h-10 rounded-full border-[#91a7bf] bg-white px-4 text-[15px] font-bold text-[#0b3558] hover:bg-[#eaf3ff]"
            onClick={async (event) => {
              event.stopPropagation();
              await copyEventLink();
            }}
          >
            <Link2 className="size-4" />
            {copied ? "Copied" : "Copy link"}
          </Button>
          <Link href={`/book/${eventType.slug}`} target="_blank" rel="noopener noreferrer" className="grid size-9 place-items-center rounded-full text-[#31516f] transition hover:bg-white hover:text-[#006bff] hover:shadow-sm" onClick={(event) => event.stopPropagation()}>
            <ExternalLink className="size-6" />
          </Link>
          <button className="grid size-9 place-items-center rounded-full text-[#31516f] transition hover:bg-white hover:text-[#006bff] hover:shadow-sm" aria-label="More options" onClick={(event) => {
            event.stopPropagation();
            setMenuOpen((value) => !value);
          }}>
            <MoreVertical className="size-6" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-10 z-20 w-44 overflow-hidden rounded-md border border-[#d7e2ee] bg-white py-2 text-[15px] font-bold text-[#0b3558] shadow-xl" onClick={(event) => event.stopPropagation()}>
              <button className="block w-full px-4 py-2 text-left hover:bg-[#f1f6ff]" onClick={() => {
                setMenuOpen(false);
                onEdit?.(eventType);
              }}>Edit</button>
              <button
                className="block w-full px-4 py-2 text-left text-red-600 hover:bg-red-50"
                onClick={() => onDelete?.(eventType.id)}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function IconHoverButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn("grid size-9 place-items-center rounded-full text-[#31516f] transition hover:bg-white hover:text-[#006bff] hover:shadow-sm", className)}
      {...props}
    >
      {children}
    </button>
  );
}

function HoverUnderline({ children }: { children: React.ReactNode }) {
  return <span className="border-b-2 border-transparent group-hover:border-[#006bff]">{children}</span>;
}

function displayTime(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date.toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" }).replace(" ", "");
}

function formatDuration(minutes: number) {
  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return `${hours} ${hours === 1 ? "hr" : "hrs"}`;
  }
  return `${minutes} min`;
}

function scheduleSummary(schedule?: Schedule | null) {
  if (!schedule?.rules?.length) return "No weekly hours";
  const weekdays = schedule.rules.filter((rule) => rule.dayOfWeek >= 1 && rule.dayOfWeek <= 5);
  if (weekdays.length === 5) {
    const first = weekdays[0];
    const sameHours = weekdays.every((rule) => rule.startTime === first.startTime && rule.endTime === first.endTime);
    if (sameHours) return `Weekdays, ${displayTime(first.startTime)} - ${displayTime(first.endTime)}`;
  }
  return `${schedule.rules.length} weekly day${schedule.rules.length === 1 ? "" : "s"}`;
}

function ColorPicker({
  value,
  onChange
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = eventColors.find((color) => color.value === value) ?? eventColors[0];

  return (
    <div className="relative">
      <button
        type="button"
        className="flex items-center gap-1 rounded-full p-1 text-[#31516f] transition hover:bg-[#eaf3ff]"
        onClick={() => setOpen((state) => !state)}
        aria-label="Choose event color"
      >
        <span className="size-5 rounded-full" style={{ backgroundColor: selected.value }} />
        <ChevronDown className="size-4" />
      </button>
      {open && (
        <div className="absolute left-0 top-9 z-30 w-44 overflow-hidden rounded-lg border border-[#d7e2ee] bg-white py-2 shadow-xl">
          {eventColors.map((color) => (
            <button
              key={color.value}
              type="button"
              className="flex w-full items-center gap-3 px-3 py-2 text-left text-[15px] font-bold text-[#0b3558] transition hover:bg-[#f1f6ff] hover:text-[#006bff]"
              onClick={() => {
                onChange(color.value);
                setOpen(false);
              }}
            >
              <span className="size-5 rounded-full" style={{ backgroundColor: color.value }} />
              <span className="flex-1">{color.name}</span>
              {selected.value === color.value && <Check className="size-4 text-[#006bff]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DurationField({
  value,
  onChange
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(!presetDurations.includes(value as typeof presetDurations[number]));
  const [customValue, setCustomValue] = useState(String(value));

  function applyCustom(nextValue: string) {
    setCustomValue(nextValue);
    const parsed = Number(nextValue);
    if (Number.isFinite(parsed) && parsed >= 15 && parsed <= 240) onChange(Math.round(parsed));
  }

  return (
    <div className="mt-5">
      <button
        type="button"
        className={cn(
          "flex h-12 w-full items-center justify-between rounded-lg border bg-white px-5 text-[16px] font-bold text-[#31516f] transition",
          open ? "border-[#006bff] ring-2 ring-[#006bff]" : "border-[#c5d2e0] hover:border-[#91a7bf]"
        )}
        onClick={() => setOpen((state) => !state)}
      >
        {formatDuration(value)}
        {open ? <ChevronUp className="size-5 text-[#006bff]" /> : <ChevronDown className="size-5 text-[#006bff]" />}
      </button>
      {open && (
        <div className="mt-2 overflow-hidden rounded-lg border border-[#d7e2ee] bg-white py-2 shadow-xl">
          {presetDurations.map((duration) => (
            <button
              key={duration}
              type="button"
              className="flex w-full items-center gap-4 px-5 py-3 text-left text-[16px] font-semibold text-[#0b3558] transition hover:bg-[#f1f6ff]"
              onClick={() => {
                onChange(duration);
                setCustomOpen(false);
                setOpen(false);
              }}
            >
              <span className="w-14">{formatDuration(duration)}</span>
              {value === duration && <Check className="size-5 text-[#006bff]" />}
            </button>
          ))}
          <button
            type="button"
            className="w-full px-5 py-3 text-left text-[16px] font-semibold text-[#0b3558] transition hover:bg-[#f1f6ff]"
            onClick={() => setCustomOpen(true)}
          >
            Custom
          </button>
        </div>
      )}
      {customOpen && (
        <label className="mt-3 grid gap-2 text-[14px] font-bold text-[#55708d]">
          Custom duration
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min="15"
              max="240"
              className="h-11 rounded-lg border-[#c5d2e0] text-[16px] font-semibold"
              value={customValue}
              onChange={(event) => applyCustom(event.target.value)}
            />
            <span className="text-[16px] font-semibold text-[#55708d]">min</span>
          </div>
        </label>
      )}
    </div>
  );
}

function AvailabilityDetails({
  schedules,
  scheduleId,
  onScheduleChange,
  open = true,
  onToggle,
  onScheduleSaved
}: {
  schedules: Schedule[];
  scheduleId: string;
  onScheduleChange: (value: string) => void;
  open?: boolean;
  onToggle?: () => void;
  onScheduleSaved?: () => Promise<void>;
}) {
  const selectedSchedule = schedules.find((schedule) => schedule.id === scheduleId) ?? schedules[0];
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({
    name: selectedSchedule?.name ?? "Working hours",
    timezone: selectedSchedule?.timezone ?? "Asia/Kolkata",
    isDefault: selectedSchedule?.isDefault ?? true,
    rules: selectedSchedule?.rules ?? [],
    overrides: selectedSchedule?.overrides?.map((item) => ({ ...item, date: String(item.date).slice(0, 10) })) ?? []
  });

  useEffect(() => {
    if (!selectedSchedule) return;
    setEditing(false);
    setDraft({
      name: selectedSchedule.name,
      timezone: selectedSchedule.timezone,
      isDefault: selectedSchedule.isDefault,
      rules: selectedSchedule.rules,
      overrides: selectedSchedule.overrides.map((item) => ({ ...item, date: String(item.date).slice(0, 10) }))
    });
  }, [selectedSchedule]);

  function setScheduleDay(dayOfWeek: number, enabled: boolean) {
    const exists = draft.rules.some((rule) => rule.dayOfWeek === dayOfWeek);
    if (enabled && !exists) {
      setDraft({ ...draft, rules: [...draft.rules, { dayOfWeek, startTime: "09:00", endTime: "17:00" }] });
    }
    if (!enabled) {
      setDraft({ ...draft, rules: draft.rules.filter((rule) => rule.dayOfWeek !== dayOfWeek) });
    }
  }

  function updateScheduleRule(dayOfWeek: number, field: "startTime" | "endTime", value: string) {
    setDraft({
      ...draft,
      rules: draft.rules.map((rule) => rule.dayOfWeek === dayOfWeek ? { ...rule, [field]: value } : rule)
    });
  }

  async function saveSchedule() {
    if (!selectedSchedule) return;
    setSaving(true);
    try {
      await api(`/availability/${selectedSchedule.id}`, { method: "PUT", body: JSON.stringify(draft) });
      await onScheduleSaved?.();
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="border-b border-[#d7e2ee]">
      <button
        type="button"
        className="flex w-full items-center justify-between px-7 py-6 text-left transition hover:bg-[#f1f6ff]"
        onClick={onToggle}
      >
        <div>
          <h3 className="text-[20px] font-bold text-[#0b3558]">Availability</h3>
          {!open && <p className="mt-3 text-[16px] font-semibold text-[#6b83a1]">{scheduleSummary(selectedSchedule)}</p>}
        </div>
        {open ? <ChevronUp className="size-5 text-[#31516f]" /> : <ChevronDown className="size-5 text-[#31516f]" />}
      </button>

      {open && <div className="px-7 pb-6">

      <div className="mt-7">
        <p className="text-[16px] font-bold text-[#0b3558]">Date-range</p>
        <p className="mt-4 text-[16px] font-semibold leading-7 text-[#31516f]">
          Invitees can schedule <span className="font-bold text-[#006bff]">60 days <ChevronDown className="inline size-4" /></span> into the future with at least <span className="font-bold text-[#006bff]">4 hours <ChevronDown className="inline size-4" /></span> notice
        </p>
      </div>

      <label className="mt-7 flex flex-wrap items-center gap-2 text-[16px] font-bold text-[#0b3558]">
        Schedule:
        <select
          className="max-w-full bg-transparent font-bold text-[#006bff] outline-none"
          value={selectedSchedule?.id ?? ""}
          onChange={(event) => onScheduleChange(event.target.value)}
        >
          {schedules.map((schedule) => <option key={schedule.id} value={schedule.id}>{schedule.name}{schedule.isDefault ? " (default)" : ""}</option>)}
        </select>
      </label>

      <div className="mt-7 overflow-hidden rounded-lg border border-[#d7e2ee] bg-white">
        <div className="flex items-center justify-between border-b border-[#d7e2ee] px-7 py-5 text-[16px] font-semibold leading-6 text-[#6b83a1]">
          <span>This event type uses the weekly and custom hours saved on the schedule</span>
          <button
            type="button"
            className="grid size-9 shrink-0 place-items-center rounded-full text-[#31516f] transition hover:bg-[#eaf3ff] hover:text-[#006bff]"
            onClick={() => setEditing((value) => !value)}
            aria-label="Edit schedule hours"
          >
            <Pencil className="size-5" />
          </button>
        </div>
        <div className="px-7 py-6">
          <h4 className="mb-5 flex items-center gap-2 text-[17px] font-bold text-[#0b3558]"><Repeat2 className="size-5" />Weekly hours</h4>
          <div className="grid gap-4">
            {weekDays.map(([label, dayOfWeek]) => {
              const rule = (editing ? draft.rules : selectedSchedule?.rules)?.find((item) => item.dayOfWeek === dayOfWeek);
              return (
                <div key={`${label}-${dayOfWeek}`} className="grid grid-cols-[34px_1fr] items-center gap-5 text-[16px] font-semibold text-[#31516f]">
                  <button
                    type="button"
                    className={cn("grid size-8 place-items-center rounded-full text-sm font-bold", rule ? "bg-[#0b3558] text-white" : "bg-[#eef3fb] text-[#55708d]")}
                    onClick={() => editing && setScheduleDay(dayOfWeek, !rule)}
                  >
                    {label}
                  </button>
                  {editing ? (
                    rule ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <Input
                          className="h-10 w-[116px] border-0 bg-[#f7f8fb] text-center text-[15px] font-bold text-[#0b3558] shadow-none"
                          type="time"
                          value={rule.startTime}
                          onChange={(event) => updateScheduleRule(dayOfWeek, "startTime", event.target.value)}
                        />
                        <span className="text-[#6b83a1]">-</span>
                        <Input
                          className="h-10 w-[116px] border-0 bg-[#f7f8fb] text-center text-[15px] font-bold text-[#0b3558] shadow-none"
                          type="time"
                          value={rule.endTime}
                          onChange={(event) => updateScheduleRule(dayOfWeek, "endTime", event.target.value)}
                        />
                        <button type="button" className="grid size-8 place-items-center rounded-full text-[#55708d] hover:bg-[#eaf3ff]" onClick={() => setScheduleDay(dayOfWeek, false)}>
                          <X className="size-4" />
                        </button>
                      </div>
                    ) : (
                      <button type="button" className="text-left font-bold text-[#006bff] hover:text-[#0051bd]" onClick={() => setScheduleDay(dayOfWeek, true)}>
                        Add hours
                      </button>
                    )
                  ) : (
                    rule ? <span>{displayTime(rule.startTime)} <span className="mx-3">-</span> {displayTime(rule.endTime)}</span> : <span className="text-[#6b83a1]">Unavailable</span>
                  )}
                </div>
              );
            })}
          </div>
          {editing ? (
            <label className="mt-6 grid gap-2 text-[14px] font-bold text-[#55708d]">
              Time zone
              <Input
                className="h-10 border-[#d7e2ee] text-[15px] font-semibold text-[#0b3558]"
                value={draft.timezone}
                onChange={(event) => setDraft({ ...draft, timezone: event.target.value })}
              />
            </label>
          ) : (
            <p className="mt-6 text-[15px] font-bold text-[#31516f]">{selectedSchedule?.timezone ?? "Asia/Kolkata"}</p>
          )}
          <h4 className="mt-7 flex items-center gap-2 text-[17px] font-bold text-[#0b3558]"><Calendar className="size-5" />Date-specific hours</h4>
          <p className="mt-5 text-[16px] font-semibold text-[#31516f]">{draft.overrides?.length ? `${draft.overrides.length} override${draft.overrides.length > 1 ? "s" : ""}` : "None"}</p>
          {editing && (
            <div className="mt-6 flex justify-end gap-3">
              <Button type="button" variant="outline" className="h-10 rounded-full border-[#91a7bf] bg-white px-5 font-bold" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button type="button" className="h-10 rounded-full px-5 font-bold" onClick={saveSchedule} disabled={saving}>
                {saving ? "Saving..." : "Save hours"}
              </Button>
            </div>
          )}
        </div>
      </div>
      </div>}
    </section>
  );
}

function EventSettingsDrawer({
  eventType,
  schedules,
  onClose,
  onSaved
}: {
  eventType: EventType;
  schedules: Schedule[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [form, setForm] = useState({
    name: eventType.name,
    slug: eventType.slug,
    color: eventType.color ?? "#8247f5",
    description: eventType.description ?? "",
    location: eventType.location || "No location set",
    durationMinutes: eventType.durationMinutes,
    bufferBeforeMinutes: eventType.bufferBeforeMinutes,
    bufferAfterMinutes: eventType.bufferAfterMinutes,
    scheduleId: eventType.scheduleId ?? schedules[0]?.id ?? "",
    isActive: eventType.isActive,
    customQuestions: eventType.customQuestions.map(({ label, required }) => ({ label, required }))
  });
  const [saving, setSaving] = useState(false);
  const [openSections, setOpenSections] = useState({
    duration: false,
    slug: false,
    availability: false
  });

  function toggleSection(section: keyof typeof openSections) {
    setOpenSections((current) => ({ ...current, [section]: !current[section] }));
  }

  async function save() {
    setSaving(true);
    try {
      await api(`/event-types/${eventType.id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...form,
          slug: slugify(form.slug || form.name),
          location: form.location.trim() || "No location set"
        })
      });
      await onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[540px] flex-col border-l border-[#d7e2ee] bg-white shadow-2xl">
      <button className="absolute right-8 top-7 rounded-full p-1 text-[#31516f] transition hover:bg-[#eaf3ff] hover:text-[#006bff]" onClick={onClose} aria-label="Close event settings">
        <X className="size-8" />
      </button>

      <div className="flex-1 overflow-y-auto">
        <section className="border-b border-[#d7e2ee] px-8 pb-7 pt-20">
          <div className="flex items-start justify-between gap-5">
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-bold text-[#55708d]">Event type</p>
              <div className="mt-2 flex items-center gap-2">
                <ColorPicker value={form.color} onChange={(color) => setForm({ ...form, color })} />
                <Input
                  className="h-11 min-w-0 border-0 px-0 text-[28px] font-bold leading-none text-[#0b3558] shadow-none focus:ring-0"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                />
              </div>
              <p className="mt-2 text-[15px] font-semibold text-[#6b83a1]">One-on-One</p>
            </div>
          </div>
        </section>

        <section className="border-b border-[#d7e2ee]">
          <button
            type="button"
            className="flex w-full items-center justify-between px-8 py-6 text-left transition hover:bg-[#f1f6ff]"
            onClick={() => toggleSection("duration")}
          >
            <div>
              <h3 className="text-[21px] font-bold text-[#0b3558]">Duration</h3>
              {!openSections.duration && <p className="mt-3 flex items-center gap-3 text-[16px] font-semibold text-[#6b83a1]"><Clock3 className="size-5" />{formatDuration(form.durationMinutes)}</p>}
            </div>
            {openSections.duration ? <ChevronUp className="size-5 text-[#31516f]" /> : <ChevronDown className="size-5 text-[#31516f]" />}
          </button>
          {openSections.duration && (
            <div className="px-8 pb-6">
              <DurationField value={form.durationMinutes} onChange={(durationMinutes) => setForm({ ...form, durationMinutes })} />
            </div>
          )}
        </section>

        <section className="border-b border-[#d7e2ee]">
          <button
            type="button"
            className="flex w-full items-center justify-between px-8 py-6 text-left transition hover:bg-[#f1f6ff]"
            onClick={() => toggleSection("slug")}
          >
            <div className="min-w-0">
              <h3 className="text-[21px] font-bold text-[#0b3558]">URL slug</h3>
              {!openSections.slug && <p className="mt-3 truncate text-[16px] font-semibold text-[#6b83a1]">{publicBookingUrl(form.slug)}</p>}
            </div>
            {openSections.slug ? <ChevronUp className="size-5 shrink-0 text-[#31516f]" /> : <ChevronDown className="size-5 shrink-0 text-[#31516f]" />}
          </button>
          {openSections.slug && (
            <div className="px-8 pb-6">
              <div className="rounded-lg border border-[#d7e2ee] bg-white px-4 py-3 focus-within:border-[#006bff] focus-within:ring-2 focus-within:ring-[#006bff]">
                <p className="mb-1 text-[13px] font-bold text-[#6b83a1]">Booking link</p>
                <div className="flex items-center gap-1 text-[16px] font-semibold text-[#55708d]">
                  <span className="shrink-0">{publicBookingBaseUrl()}</span>
                  <input
                    className="min-w-0 flex-1 bg-transparent font-bold text-[#0b3558] outline-none"
                    value={form.slug}
                    onChange={(event) => setForm({ ...form, slug: slugify(event.target.value) })}
                    onBlur={() => setForm((current) => ({ ...current, slug: slugify(current.slug || current.name) }))}
                  />
                </div>
              </div>
            </div>
          )}
        </section>

        <AvailabilityDetails
          schedules={schedules}
          scheduleId={form.scheduleId}
          onScheduleChange={(scheduleId) => setForm({ ...form, scheduleId })}
          open={openSections.availability}
          onToggle={() => toggleSection("availability")}
          onScheduleSaved={onSaved}
        />

        <section className="border-b border-[#d7e2ee] px-8 py-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[21px] font-bold text-[#0b3558]">Host</h3>
          </div>
          <p className="mt-5 flex items-center gap-3 text-[16px] font-semibold text-[#6b83a1]">
            <span className="grid size-7 place-items-center rounded-full bg-[#eef3fb] text-sm font-bold text-[#0b3558]">Y</span>
            Yash Agarwal (you)
          </p>
        </section>
      </div>

      <div className="flex items-center justify-end gap-7 border-t border-[#d7e2ee] bg-white px-8 py-5">
        <Link href={`/book/${eventType.slug}`} className="group mr-auto flex items-center gap-2 text-[16px] font-bold text-[#0b3558] hover:text-[#006bff]">
          <Eye className="size-5" />
          <HoverUnderline>Preview</HoverUnderline>
        </Link>
        <Button className="h-12 rounded-full px-7 text-[16px] font-bold" onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </aside>
  );
}

function BulkActionBar({
  count,
  onClear,
  onDelete,
  onToggle
}: {
  count: number;
  onClear: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  if (!count) return null;

  return (
    <div className="fixed bottom-8 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-lg border border-[#d7e2ee] bg-white px-5 py-3 text-[16px] font-bold text-[#0b3558] shadow-[0_10px_30px_rgba(11,53,88,0.16)]">
      <span className="grid size-6 place-items-center rounded-full bg-[#eaf3ff] text-sm text-[#006bff]">{count}</span>
      <span>selected</span>
      <button className="flex h-10 items-center gap-2 rounded-full border border-[#91a7bf] px-4 transition hover:bg-[#eaf3ff]" onClick={onDelete}>
        <Trash2 className="size-5" />
        Delete
      </button>
      <button className="flex h-10 items-center gap-2 rounded-full border border-[#91a7bf] px-4 transition hover:bg-[#eaf3ff]" onClick={onToggle}>
        Toggle on/off
        <ChevronDown className="size-4" />
      </button>
      <button className="h-10 rounded-full border border-[#d7e2ee] px-4 text-[#91a7bf]" disabled>
        Copy availability from
      </button>
      <button className="grid size-9 place-items-center rounded-full transition hover:bg-[#eaf3ff]" onClick={onClear} aria-label="Clear selected event types">
        <X className="size-5" />
      </button>
    </div>
  );
}

function CreateMenu({
  onSelect,
  position
}: {
  onSelect: () => void;
  position?: { top: number; left: number } | null;
}) {
  return (
    <div
      className={cn(
        "z-30 w-[426px] overflow-hidden rounded-md border border-[#d7e2ee] bg-white text-[#0b3558] shadow-xl max-sm:w-[calc(100vw-2rem)]",
        position ? "fixed" : "absolute right-0 top-[58px] max-sm:right-auto max-sm:left-0"
      )}
      style={position ? { top: position.top, left: position.left } : undefined}
    >
      <div className="p-5">
        <p className="mb-4 text-[16px] font-bold text-[#55708d]">Event type</p>
        <div className="grid gap-5">
          {createOptions.map((option) => (
            <button key={option.title} className="group rounded-md p-2 text-left transition hover:bg-[#f1f6ff]" onClick={onSelect}>
              <p className="text-[16px] font-bold text-[#005bcf]">{option.title}</p>
              <p className="mt-1 text-[16px] font-bold text-[#0b3558]">
                {option.meta} <ArrowRight className="mx-1 inline size-5" /> {option.arrow}
              </p>
              <p className="mt-1 text-[16px] font-semibold text-[#6b83a1]">{option.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function EventDrawer({
  draft,
  setDraft,
  schedules,
  onSchedulesChange,
  onClose,
  onCreate,
  creating,
  preview = false
}: {
  draft: EventDraft;
  setDraft: (value: EventDraft) => void;
  schedules: Schedule[];
  onSchedulesChange: () => Promise<void>;
  onClose: () => void;
  onCreate: () => void;
  creating: boolean;
  preview?: boolean;
}) {
  const selectedSchedule = schedules.find((schedule) => schedule.id === draft.scheduleId) ?? schedules[0];
  const [openSections, setOpenSections] = useState({
    duration: false,
    slug: true,
    availability: false
  });

  function toggleSection(section: keyof typeof openSections) {
    setOpenSections((current) => ({ ...current, [section]: !current[section] }));
  }

  return (
    <aside className="fixed inset-y-0 right-0 z-40 flex w-full max-w-[470px] flex-col border-l border-[#d7e2ee] bg-white shadow-2xl">
      <button className="absolute right-7 top-7 rounded-full p-1 text-[#31516f] transition hover:bg-[#eaf3ff] hover:text-[#006bff]" onClick={onClose} aria-label="Close drawer">
        <X className="size-7" />
      </button>

      <div className="border-b border-[#d7e2ee] px-7 pb-7 pt-20">
        <p className="text-[15px] font-bold text-[#55708d]">Event type</p>
        <div className={cn("mt-2 flex h-12 items-center rounded-lg", !preview && "border-2 border-[#0099ff] px-2")}>
          <ColorPicker value={draft.color} onChange={(color) => setDraft({ ...draft, color })} />
          {preview ? (
            <h2 className="ml-2 text-[26px] font-bold leading-none text-[#0b3558]">{draft.name}</h2>
          ) : (
            <input
              autoFocus
              value={draft.name}
              onChange={(event) => setDraft({ ...draft, name: event.target.value, slug: slugify(event.target.value) })}
              className="ml-2 min-w-0 flex-1 text-[26px] font-bold leading-none text-[#0b3558] outline-none"
            />
          )}
        </div>
        <p className="mt-2 text-[15px] font-semibold text-[#6b83a1]">One-on-One</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <section className="border-b border-[#d7e2ee]">
          <button
            type="button"
            className="flex w-full items-center justify-between px-7 py-6 text-left transition hover:bg-[#f1f6ff]"
            onClick={() => toggleSection("duration")}
          >
            <div>
              <h3 className="text-[20px] font-bold text-[#0b3558]">Duration</h3>
              {!openSections.duration && <p className="mt-3 flex items-center gap-3 text-[16px] font-semibold text-[#6b83a1]"><Clock3 className="size-5" />{formatDuration(draft.durationMinutes)}</p>}
            </div>
            {openSections.duration ? <ChevronUp className="size-5 text-[#31516f]" /> : <ChevronDown className="size-5 text-[#31516f]" />}
          </button>
          {openSections.duration && (
            <div className="px-7 pb-6">
              <DurationField value={draft.durationMinutes} onChange={(durationMinutes) => setDraft({ ...draft, durationMinutes })} />
            </div>
          )}
        </section>

        <section className="border-b border-[#d7e2ee]">
          <button
            type="button"
            className="flex w-full items-center justify-between px-7 py-6 text-left transition hover:bg-[#f1f6ff]"
            onClick={() => toggleSection("slug")}
          >
            <div className="min-w-0">
              <h3 className="text-[20px] font-bold text-[#0b3558]">URL slug</h3>
              {!openSections.slug && <p className="mt-3 truncate text-[16px] font-semibold text-[#6b83a1]">{publicBookingUrl(draft.slug)}</p>}
            </div>
            {openSections.slug ? <ChevronUp className="size-5 shrink-0 text-[#31516f]" /> : <ChevronDown className="size-5 shrink-0 text-[#31516f]" />}
          </button>
          {openSections.slug && (
            <div className="px-7 pb-6">
              <div className="rounded-lg border border-[#d7e2ee] bg-white px-4 py-3 focus-within:border-[#006bff] focus-within:ring-2 focus-within:ring-[#006bff]">
                <p className="mb-1 text-[13px] font-bold text-[#6b83a1]">Booking link</p>
                <div className="flex items-center gap-1 text-[16px] font-semibold text-[#55708d]">
                  <span className="shrink-0">{publicBookingBaseUrl()}</span>
                  <input
                    className="min-w-0 flex-1 bg-transparent font-bold text-[#0b3558] outline-none"
                    value={draft.slug}
                    onChange={(event) => setDraft({ ...draft, slug: slugify(event.target.value) })}
                    onBlur={() => setDraft({ ...draft, slug: slugify(draft.slug || draft.name) })}
                  />
                </div>
              </div>
            </div>
          )}
        </section>

        <AvailabilityDetails
          schedules={schedules}
          scheduleId={selectedSchedule?.id ?? ""}
          onScheduleChange={(scheduleId) => setDraft({ ...draft, scheduleId })}
          open={openSections.availability}
          onToggle={() => toggleSection("availability")}
          onScheduleSaved={onSchedulesChange}
        />

        <section className="border-b border-[#d7e2ee] px-7 py-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[20px] font-bold text-[#0b3558]">Host</h3>
          </div>
          <p className="mt-4 flex items-center gap-3 text-[16px] font-semibold text-[#6b83a1]">
            <span className="grid size-7 place-items-center rounded-full bg-[#eef3fb] text-sm font-bold text-[#0b3558]">Y</span>
            Yash Agarwal (you)
          </p>
        </section>
      </div>

      <div className="flex items-center justify-end gap-7 border-t border-[#d7e2ee] px-7 py-5">
        {preview && <button className="group mr-auto text-[16px] font-bold text-[#0b3558] hover:text-[#006bff]"><HoverUnderline>Preview</HoverUnderline></button>}
        <Button className="h-12 rounded-full px-7 text-[16px] font-bold" onClick={onCreate} disabled={creating}>
          {creating ? "Creating..." : preview ? "Save changes" : "Create"}
        </Button>
      </div>
    </aside>
  );
}

function PreviewPanel({
  draft,
  schedules
}: {
  draft: EventDraft;
  schedules: Schedule[];
}) {
  const schedule = schedules.find((item) => item.id === draft.scheduleId) ?? schedules[0];
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [timezone, setTimezone] = useState(schedule?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone);
  const bookingUrl = publicBookingUrl(draft.slug);
  const timezoneOptions = Array.from(new Set([schedule?.timezone, Intl.DateTimeFormat().resolvedOptions().timeZone, "UTC"].filter(Boolean))) as string[];

  useEffect(() => {
    if (schedule?.timezone) setTimezone(schedule.timezone);
  }, [schedule?.timezone]);

  const calendarDays = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const leadingBlanks = (firstDay + 6) % 7;
    return [
      ...Array.from({ length: leadingBlanks }, () => null),
      ...Array.from({ length: daysInMonth }, (_, index) => new Date(year, month, index + 1))
    ];
  }, [visibleMonth]);

  function ruleForDate(date: Date) {
    const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay();
    return schedule?.rules.find((rule) => rule.dayOfWeek === dayOfWeek);
  }

  const selectedRule = selectedDate ? ruleForDate(selectedDate) : undefined;
  const previewTimes = useMemo(() => {
    if (!selectedRule) return [];
    const [startHour, startMinute] = selectedRule.startTime.split(":").map(Number);
    const [endHour, endMinute] = selectedRule.endTime.split(":").map(Number);
    const start = startHour * 60 + startMinute;
    const end = endHour * 60 + endMinute;
    const times: string[] = [];
    for (let minute = start; minute + draft.durationMinutes <= end && times.length < 10; minute += draft.durationMinutes) {
      const hour = Math.floor(minute / 60);
      const mins = minute % 60;
      times.push(displayTime(`${String(hour).padStart(2, "0")}:${String(mins).padStart(2, "0")}`));
    }
    return times;
  }, [draft.durationMinutes, selectedRule]);

  async function copyLink() {
    await navigator.clipboard?.writeText(bookingUrl);
  }

  return (
    <div className="flex min-h-[calc(100vh-68px)] justify-center bg-[#fbfbfc] px-6 py-24 lg:mr-[470px]">
      <div className="w-full max-w-[820px]">
        <div className="mb-36 flex items-center justify-between">
          <h1 className="flex items-center gap-3 text-[26px] font-bold text-[#0b3558]">
            <span className="size-4 rounded-full" style={{ backgroundColor: draft.color }} />
            Preview of {draft.name}
          </h1>
          <div className="flex items-center gap-5 text-[#31516f]">
            <IconHoverButton><CalendarPlus className="size-5" /></IconHoverButton>
            <IconHoverButton><MailCheck className="size-5" /></IconHoverButton>
            <IconHoverButton><Share2 className="size-5" /></IconHoverButton>
            <Button variant="outline" className="h-9 rounded-full border-[#91a7bf] bg-white font-bold hover:bg-[#eaf3ff]" onClick={copyLink}>
              <Link2 className="size-4" />
              Copy link
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-[#d7e2ee] bg-white shadow-lg">
          <div className="flex h-10 items-center justify-between bg-[#0b3558] px-5 text-sm font-bold text-white">
            <span>This is a preview. <span className="font-semibold">To book an event, share the link with your invitees.</span></span>
            <Link href={`/book/${draft.slug}`} target="_blank" rel="noopener noreferrer" className="grid size-8 place-items-center rounded-full transition hover:bg-white/15" aria-label="Open booking page">
              <ExternalLink className="size-5" />
            </Link>
          </div>
          <div className="grid min-h-[710px] md:grid-cols-[410px_1fr]">
            <section className="border-r border-[#d7e2ee] p-8">
              <p className="text-[16px] font-bold text-[#888]">Yash Agarwal</p>
              <h2 className="mt-3 text-[30px] font-bold italic text-[#0b3558]">{draft.name}</h2>
              <p className="mt-8 flex items-center gap-3 text-[16px] font-bold text-[#777]"><Clock3 className="size-5" />{formatDuration(draft.durationMinutes)}</p>
              <p className="mt-4 flex items-center gap-3 text-[16px] font-bold italic text-[#777]"><MapPin className="size-5" />Add a location for it to show here</p>
            </section>
            <section className="p-8">
              <h3 className="text-[22px] font-bold text-[#0b3558]">Select a Date & Time</h3>
              <div className="mt-10 flex items-center justify-center gap-10 text-[17px] font-bold text-[#55708d]">
                <button className="grid size-10 place-items-center rounded-full hover:bg-[#eaf3ff] hover:text-[#006bff]" onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1))} aria-label="Previous month">
                  <ChevronLeft className="size-6" />
                </button>
                {visibleMonth.toLocaleDateString("en", { month: "long", year: "numeric" })}
                <button className="grid size-12 place-items-center rounded-full bg-blue-50 text-[#006bff] hover:bg-[#dcecff]" onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1))} aria-label="Next month">
                  <ChevronRight className="size-7" />
                </button>
              </div>
              <div className="mt-8 grid grid-cols-7 gap-y-7 text-center text-[14px] font-bold text-[#55708d]">
                {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((day) => <span key={day}>{day}</span>)}
                {calendarDays.map((date, index) => {
                  if (!date) return <span key={`blank-${index}`} />;
                  const isAvailable = Boolean(ruleForDate(date));
                  const isSelected = selectedDate?.toDateString() === date.toDateString();
                  return (
                    <button
                      key={date.toISOString()}
                      className={cn(
                        "mx-auto grid size-11 place-items-center rounded-full text-[18px] transition",
                        isAvailable ? "bg-blue-50 font-bold text-[#006bff] hover:bg-[#dcecff]" : "text-[#91a7bf]",
                        isSelected && "bg-[#006bff] text-white hover:bg-[#006bff]"
                      )}
                      disabled={!isAvailable}
                      onClick={() => {
                        setSelectedDate(date);
                        setSelectedTime("");
                      }}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
              {selectedDate && (
                <div className="mt-8">
                  <p className="text-[15px] font-bold text-[#0b3558]">{selectedDate.toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" })}</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {previewTimes.map((time) => (
                      <button
                        key={time}
                        className={cn(
                          "h-11 rounded-lg border border-[#006bff] text-[15px] font-bold text-[#006bff] transition hover:bg-[#eaf3ff]",
                          selectedTime === time && "bg-[#006bff] text-white hover:bg-[#006bff]"
                        )}
                        onClick={() => setSelectedTime(time)}
                      >
                        {time}
                      </button>
                    ))}
                    {!previewTimes.length && <p className="text-[15px] font-semibold text-[#6b83a1]">No times for this date.</p>}
                  </div>
                </div>
              )}
              <div className="mt-12">
                <p className="text-[15px] font-bold text-[#0b3558]">Time zone</p>
                <select
                  className="mt-4 max-w-full bg-transparent text-[16px] font-bold text-[#55708d] outline-none hover:text-[#006bff]"
                  value={timezone}
                  onChange={(event) => setTimezone(event.target.value)}
                >
                  {timezoneOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <Button variant="outline" className="mt-10 h-12 rounded-full border-[#91a7bf] bg-white font-bold" disabled={!selectedTime}>
                {selectedTime ? `Selected ${selectedTime}` : "Troubleshoot"}
              </Button>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function SchedulingInfoDrawer({ onClose }: { onClose: () => void }) {
  return (
    <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[540px] flex-col border-l border-[#d7e2ee] bg-white shadow-2xl">
      <button className="absolute right-8 top-7 text-[#31516f] transition hover:text-[#006bff]" onClick={onClose} aria-label="Close scheduling help">
        <X className="size-8" />
      </button>

      <div className="px-8 pb-0 pt-20">
        <h2 className="text-[34px] font-bold leading-tight tracking-normal text-[#0b3558]">About scheduling</h2>
        <div className="mt-10 flex gap-10 border-b border-[#d7e2ee] text-[16px] font-bold text-[#55708d]">
          <button className="border-b-[4px] border-[#006bff] pb-6 text-[#0b3558]">Event types</button>
        </div>
      </div>

      <div className="px-8 py-8">
        <p className="mb-5 text-[17px] font-bold text-[#55708d]">See Help Articles</p>
        <button className="flex w-full items-center justify-between py-1 text-left text-[17px] font-semibold text-[#0b3558]">
          Event types overview
          <ChevronRight className="size-5 text-[#31516f]" />
        </button>
        <a href="https://help.calendly.com/" target="_blank" rel="noopener noreferrer" className="mt-8 flex items-center gap-2 text-[17px] font-bold text-[#006bff]">
          See all articles in the help center
          <ExternalLink className="size-5" />
        </a>
      </div>
    </aside>
  );
}

export default function EventTypesPage() {
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [createMenuPosition, setCreateMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventType | null>(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<EventDraft>({
    name: "New Meeting",
    slug: "new-meeting",
    color: "#8247f5",
    durationMinutes: 30,
    scheduleId: ""
  });
  const [query, setQuery] = useState("");

  const defaultScheduleId = schedules[0]?.id;
  const displayEvents = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return eventTypes;
    return eventTypes.filter((eventType) => (
      eventType.name.toLowerCase().includes(normalized)
      || eventType.slug.toLowerCase().includes(normalized)
      || eventType.location.toLowerCase().includes(normalized)
    ));
  }, [eventTypes, query]);

  async function load() {
    setLoading(true);
    try {
      const [events, scheduleData] = await Promise.all([
        api<EventType[]>("/event-types"),
        api<Schedule[]>("/availability")
      ]);
      setEventTypes(events);
      setSchedules(scheduleData);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (defaultScheduleId && !draft.scheduleId) setDraft((current) => ({ ...current, scheduleId: defaultScheduleId }));
  }, [defaultScheduleId, draft.scheduleId]);

  function openCreateDrawer() {
    setMenuOpen(false);
    setCreateMenuPosition(null);
    setPreviewOpen(false);
    setEditingEvent(null);
    setDraft({
      name: "New Meeting",
      slug: "new-meeting",
      color: "#8247f5",
      durationMinutes: 30,
      scheduleId: defaultScheduleId ?? ""
    });
    setDrawerOpen(true);
  }

  function openCreateMenu(position?: { top: number; left: number } | null) {
    setPreviewOpen(false);
    setEditingEvent(null);
    setDrawerOpen(false);
    setCreateMenuPosition(position ?? null);
    setMenuOpen(true);
  }

  useEffect(() => {
    function handleOpenCreateEvent(event: Event) {
      const detail = (event as CustomEvent<{ top?: number; left?: number }>).detail;
      openCreateMenu(detail?.top != null && detail?.left != null ? { top: detail.top, left: detail.left } : null);
    }

    window.addEventListener("open-create-event", handleOpenCreateEvent);
    return () => window.removeEventListener("open-create-event", handleOpenCreateEvent);
  });

  useEffect(() => {
    const url = new URL(window.location.href);
    const createSource = url.searchParams.get("create");
    if (!createSource) return;
    openCreateMenu(createSource === "sidebar" ? { top: 107, left: 300 } : null);
    window.history.replaceState(null, "", "/");
  }, [defaultScheduleId]);

  async function createEvent() {
    setCreating(true);
    try {
      await api<EventType>("/event-types", {
        method: "POST",
        body: JSON.stringify({
          name: draft.name || "New Meeting",
          slug: slugify(draft.slug || draft.name || "new-meeting"),
          color: draft.color,
          description: "A focused one-on-one meeting.",
          location: previewOpen ? "Google Meet" : "No location set",
          durationMinutes: draft.durationMinutes,
          bufferBeforeMinutes: 0,
          bufferAfterMinutes: 0,
          scheduleId: draft.scheduleId || defaultScheduleId,
          isActive: true,
          customQuestions: []
        })
      });
      await load();
      setDrawerOpen(false);
      setPreviewOpen(true);
    } finally {
      setCreating(false);
    }
  }

  async function deleteEvent(id: string) {
    await api(`/event-types/${id}`, { method: "DELETE" });
    setSelectedIds((ids) => ids.filter((selectedId) => selectedId !== id));
    await load();
  }

  function toggleSelected(id: string) {
    setSelectedIds((ids) => ids.includes(id) ? ids.filter((selectedId) => selectedId !== id) : [...ids, id]);
  }

  async function deleteSelected() {
    await Promise.all(selectedIds.map((id) => api(`/event-types/${id}`, { method: "DELETE" })));
    setSelectedIds([]);
    await load();
  }

  async function toggleSelectedActive() {
    const selectedEvents = eventTypes.filter((eventType) => selectedIds.includes(eventType.id));
    await Promise.all(selectedEvents.map((eventType) => api(`/event-types/${eventType.id}`, {
      method: "PUT",
      body: JSON.stringify({
        name: eventType.name,
        slug: eventType.slug,
        description: eventType.description ?? "",
        location: eventType.location,
        color: eventType.color ?? "#8247f5",
        durationMinutes: eventType.durationMinutes,
        bufferBeforeMinutes: eventType.bufferBeforeMinutes,
        bufferAfterMinutes: eventType.bufferAfterMinutes,
        scheduleId: eventType.scheduleId,
        isActive: !eventType.isActive,
        customQuestions: eventType.customQuestions.map(({ label, required }) => ({ label, required }))
      })
    })));
    await load();
  }

  return (
    <main className="min-h-screen bg-[#fbfbfc]">
          <header className="hidden h-[86px] items-center justify-end bg-white px-8 lg:flex">
        <div className="flex items-center gap-6">
          <button className="grid size-9 place-items-center rounded-full text-[#0b3558] transition hover:bg-[#eaf3ff]"><Users className="size-5" /></button>
          <button className="grid size-10 place-items-center rounded-full bg-[#eef3fb] text-sm font-bold text-[#0b3558] transition hover:bg-[#eaf3ff]">Y</button>
          <button className="grid size-8 place-items-center rounded-full text-[#0b3558] transition hover:bg-[#eaf3ff]"><ChevronDown className="size-4" /></button>
        </div>
      </header>

      {previewOpen ? (
        <PreviewPanel draft={draft} schedules={schedules} />
      ) : (
        <section className="mx-auto max-w-[1490px] px-4 pb-16 pt-8 sm:px-8 lg:pt-10">
          <div className="flex flex-col gap-8 border-b border-[#d7e2ee] pb-0 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-[28px] font-bold tracking-normal text-[#0b3558]">
                Scheduling
                <button
                  className="grid size-6 place-items-center rounded-full text-[#31516f] transition hover:text-[#006bff]"
                  onClick={() => setInfoOpen(true)}
                  aria-label="About scheduling"
                >
                  <HelpCircle className="size-5" />
                </button>
              </h1>
              <div className="mt-10 flex gap-10 text-[16px] font-bold text-[#55708d]">
                <button className="border-b-[4px] border-[#006bff] pb-6 text-[#0b3558]">Event types</button>
              </div>
            </div>

            <div className="relative self-start">
              <Button className="h-12 rounded-full px-7 text-[16px] font-bold" onClick={() => {
                setCreateMenuPosition(null);
                setMenuOpen((value) => !value);
              }}>
                <Plus className="size-5" />
                Create
                {menuOpen ? <ChevronUp className="size-5" /> : <ChevronDown className="size-5" />}
              </Button>
              {menuOpen && <CreateMenu position={createMenuPosition} onSelect={() => {
                setMenuOpen(false);
                setCreateMenuPosition(null);
                setDrawerOpen(true);
                setDraft({
                  name: "New Meeting",
                  slug: "new-meeting",
                  color: "#8247f5",
                  durationMinutes: 30,
                  scheduleId: defaultScheduleId ?? ""
                });
              }} />}
            </div>
          </div>

          <div className="pt-6">
            <div className="relative max-w-[420px]">
              <Search className="absolute left-4 top-1/2 size-6 -translate-y-1/2 text-[#91a7bf]" />
              <Input
                className="h-12 rounded-lg border-[#c5d2e0] pl-12 text-[16px] font-semibold"
                placeholder="Search event types"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>

            <div className="mt-10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="grid size-10 place-items-center rounded-full bg-[#eef3fb] text-sm font-bold text-[#0b3558]">Y</span>
                <h2 className="text-[17px] font-bold text-[#0b3558]">Yash Agarwal</h2>
              </div>
              <div className="hidden items-center gap-7 md:flex">
                <Link href="/book" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 text-[16px] font-bold text-[#006bff]"><ExternalLink className="size-5" /><span className="border-b-2 border-transparent group-hover:border-[#006bff]">View landing page</span></Link>
                <button className="grid size-9 place-items-center rounded-full text-[#0b3558] transition hover:bg-white hover:text-[#006bff] hover:shadow-sm"><MoreVertical className="size-6" /></button>
              </div>
            </div>

            <div className="mt-5 grid gap-5">
              {loading ? (
                <div className="grid min-h-[240px] place-items-center rounded-lg border border-[#d7e2ee] bg-white shadow-sm">
                  <CalendlyShimmer />
                </div>
              ) : displayEvents.map((eventType) => (
                <EventRow
                  key={eventType.id}
                  eventType={eventType}
                  selected={selectedIds.includes(eventType.id)}
                  onDelete={deleteEvent}
                  onEdit={setEditingEvent}
                  onSelect={toggleSelected}
                />
              ))}
              {!loading && !displayEvents.length && (
                <EventRow
                  eventType={{
                    id: "empty",
                    name: "New Meeting",
                    slug: "30min",
                    color: "#8247f5",
                    location: "Google Meet",
                    durationMinutes: 30,
                    bufferBeforeMinutes: 0,
                    bufferAfterMinutes: 0,
                    isActive: true,
                    customQuestions: []
                  } as EventType}
                />
              )}
            </div>
          </div>
        </section>
      )}

      <BulkActionBar
        count={selectedIds.length}
        onClear={() => setSelectedIds([])}
        onDelete={deleteSelected}
        onToggle={toggleSelectedActive}
      />

      {drawerOpen && (
        <EventDrawer
          draft={draft}
          setDraft={setDraft}
          schedules={schedules}
          onSchedulesChange={load}
          onClose={() => setDrawerOpen(false)}
          onCreate={createEvent}
          creating={creating}
        />
      )}

      {previewOpen && (
        <EventDrawer
          draft={draft}
          setDraft={setDraft}
          schedules={schedules}
          onSchedulesChange={load}
          onClose={() => setPreviewOpen(false)}
          onCreate={() => setPreviewOpen(false)}
          creating={false}
          preview
        />
      )}

      {infoOpen && <SchedulingInfoDrawer onClose={() => setInfoOpen(false)} />}

      {editingEvent && (
        <EventSettingsDrawer
          eventType={editingEvent}
          schedules={schedules}
          onClose={() => setEditingEvent(null)}
          onSaved={load}
        />
      )}
    </main>
  );
}
