"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  ChevronDown,
  Clock3,
  Copy,
  Info,
  List,
  MoreVertical,
  Plus,
  Save,
  Trash2,
  Users,
  X
} from "lucide-react";
import { api } from "@/lib/api";
import type { AvailabilityRule, DateOverride, EventType, Schedule } from "@/types";
import { Button } from "@/components/ui/button";
import { CalendlyShimmer } from "@/components/CalendlyShimmer";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const days = [
  ["S", "Sunday", 7],
  ["M", "Monday", 1],
  ["T", "Tuesday", 2],
  ["W", "Wednesday", 3],
  ["T", "Thursday", 4],
  ["F", "Friday", 5],
  ["S", "Saturday", 6]
] as const;

const defaultRules: AvailabilityRule[] = [1, 2, 3, 4, 5].map((dayOfWeek) => ({
  dayOfWeek,
  startTime: "09:00",
  endTime: "17:00"
}));

function toDisplayTime(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date.toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" }).replace(" ", "");
}

export default function AvailabilityPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const selected = useMemo(() => schedules.find((schedule) => schedule.id === selectedId), [schedules, selectedId]);
  const [draft, setDraft] = useState({ name: "Working hours", timezone: "Asia/Kolkata", isDefault: true, rules: defaultRules, overrides: [] as DateOverride[] });
  const [view, setView] = useState<"list" | "calendar">("list");
  const [menuOpen, setMenuOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const activeEventCount = eventTypes.filter((eventType) => eventType.scheduleId === selectedId).length;

  async function load() {
    setLoading(true);
    try {
      const [data, events] = await Promise.all([
        api<Schedule[]>("/availability"),
        api<EventType[]>("/event-types")
      ]);
      setSchedules(data);
      setEventTypes(events);
      const nextSelected = selectedId && data.some((schedule) => schedule.id === selectedId) ? selectedId : data[0]?.id ?? "";
      setSelectedId(nextSelected);
      const selectedSchedule = data.find((schedule) => schedule.id === nextSelected) ?? data[0];
      if (selectedSchedule) {
        setDraft({
          name: selectedSchedule.name,
          timezone: selectedSchedule.timezone,
          isDefault: selectedSchedule.isDefault,
          rules: selectedSchedule.rules,
          overrides: selectedSchedule.overrides.map((item) => ({ ...item, date: String(item.date).slice(0, 10) }))
        });
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!selected) return;
    setDraft({
      name: selected.name,
      timezone: selected.timezone,
      isDefault: selected.isDefault,
      rules: selected.rules,
      overrides: selected.overrides.map((item) => ({ ...item, date: String(item.date).slice(0, 10) }))
    });
  }, [selected]);

  function setDay(dayOfWeek: number, enabled: boolean) {
    const exists = draft.rules.some((rule) => rule.dayOfWeek === dayOfWeek);
    if (enabled && !exists) {
      setDraft({ ...draft, rules: [...draft.rules, { dayOfWeek, startTime: "09:00", endTime: "17:00" }] });
    }
    if (!enabled) {
      setDraft({ ...draft, rules: draft.rules.filter((rule) => rule.dayOfWeek !== dayOfWeek) });
    }
  }

  function updateRule(dayOfWeek: number, field: "startTime" | "endTime", value: string) {
    setDraft({
      ...draft,
      rules: draft.rules.map((rule) => rule.dayOfWeek === dayOfWeek ? { ...rule, [field]: value } : rule)
    });
  }

  function copyRuleToWeekdays(source: AvailabilityRule) {
    const weekdays = [1, 2, 3, 4, 5];
    const existingByDay = new Map(draft.rules.map((rule) => [rule.dayOfWeek, rule]));
    setDraft({
      ...draft,
      rules: [
        ...draft.rules.filter((rule) => !weekdays.includes(rule.dayOfWeek)),
        ...weekdays.map((dayOfWeek) => ({
          ...existingByDay.get(dayOfWeek),
          dayOfWeek,
          startTime: source.startTime,
          endTime: source.endTime
        }))
      ].sort((a, b) => a.dayOfWeek - b.dayOfWeek)
    });
  }

  async function createSchedule() {
    const name = `Working hours ${schedules.length + 1}`;
    await api("/availability", {
      method: "POST",
      body: JSON.stringify({ name, timezone: draft.timezone, isDefault: false, rules: defaultRules, overrides: [] })
    });
    setMenuOpen(false);
    await load();
  }

  async function deleteSchedule() {
    if (!selectedId || schedules.length <= 1) return;
    await api(`/availability/${selectedId}`, { method: "DELETE" });
    setMenuOpen(false);
    setSelectedId("");
    await load();
  }

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      if (selectedId) {
        await api(`/availability/${selectedId}`, { method: "PUT", body: JSON.stringify(draft) });
      } else {
        await api("/availability", { method: "POST", body: JSON.stringify(draft) });
      }
      await load();
      setMessage("Schedule saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save schedule.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main>
        <header className="hidden h-[86px] items-center justify-end bg-white px-8 lg:flex">
          <div className="flex items-center gap-5">
            <Users className="size-5 text-[#0b3558]" />
            <button className="grid size-10 place-items-center rounded-full bg-[#eef3fb] text-sm font-bold text-[#0b3558]">Y</button>
            <ChevronDown className="size-4 text-[#0b3558]" />
          </div>
        </header>

        <div className="mx-auto max-w-[1280px] px-4 pb-16 pt-6 sm:px-6 lg:pt-8">
          <div className="mb-7">
            <h1 className="text-[26px] font-bold tracking-normal text-[#0b3558]">Availability</h1>
            <div className="mt-7 flex gap-6 overflow-x-auto border-b border-[#d7e2ee] text-[15px] font-bold text-[#55708d] sm:gap-9">
              <button className="border-b-[3px] border-[#006bff] pb-5 text-[#0b3558]">Schedules</button>
            </div>
          </div>

          {loading ? (
            <section className="grid min-h-[520px] place-items-center overflow-hidden rounded-lg border border-[#d7e2ee] bg-white">
              <CalendlyShimmer />
            </section>
          ) : <section className="overflow-hidden rounded-lg border border-[#d7e2ee] bg-white">
            <div className="border-b border-[#d7e2ee] px-4 py-7 sm:px-8 sm:py-9">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <p className="text-[15px] font-bold text-[#55708d]">Schedule</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <Input
                      className="h-11 max-w-[300px] border-[#d7e2ee] text-[16px] font-bold text-[#0b3558]"
                      value={draft.name}
                      onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                      aria-label="Schedule name"
                    />
                  </div>
                  <div className="mt-5 flex flex-wrap items-center gap-3 text-[15px] font-bold text-[#0b3558]">
                    <span>Active on:</span>
                    <Info className="size-5 fill-[#0b3558] text-white" />
                    <span className="text-[#006bff]">{activeEventCount} event type{activeEventCount === 1 ? "" : "s"}</span>
                    <ChevronDown className="size-4 text-[#006bff]" />
                    <label className="ml-0 flex items-center gap-2 text-[#55708d] md:ml-3">
                      Time zone
                      <select
                        className="rounded-md border border-[#d7e2ee] bg-white px-3 py-2 font-bold text-[#0b3558] outline-none"
                        value={draft.timezone}
                        onChange={(event) => setDraft({ ...draft, timezone: event.target.value })}
                      >
                        {["Asia/Kolkata", "UTC", "America/New_York", "Europe/London"].map((timezone) => (
                          <option key={timezone} value={timezone}>{timezone}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>

                <div className="flex items-center gap-5">
                  <div className="flex rounded-lg bg-[#eaf1fa] p-1">
                    <button
                      className={cn("flex h-10 items-center gap-2 rounded-md px-4 text-[15px] font-bold", view === "list" ? "bg-white text-[#0b3558] shadow-md" : "text-[#55708d]")}
                      onClick={() => setView("list")}
                    >
                      <List className="size-5" />
                      List
                    </button>
                    <button
                      className={cn("flex h-10 items-center gap-2 rounded-md px-4 text-[15px] font-bold", view === "calendar" ? "bg-white text-[#0b3558] shadow-md" : "text-[#55708d]")}
                      onClick={() => setView("calendar")}
                    >
                      <Calendar className="size-5" />
                      Calendar
                    </button>
                  </div>
                  <div className="relative">
                    <button className="grid size-9 place-items-center rounded-full text-[#0b3558] hover:bg-[#eaf3ff]" onClick={() => setMenuOpen((value) => !value)} aria-label="Schedule menu">
                      <MoreVertical className="size-6" />
                    </button>
                    {menuOpen && (
                      <div className="absolute right-0 top-11 z-20 w-48 overflow-hidden rounded-md border border-[#d7e2ee] bg-white py-2 text-[15px] font-bold text-[#0b3558] shadow-xl">
                        <button className="block w-full px-4 py-2 text-left hover:bg-[#f1f6ff]" onClick={createSchedule}>New schedule</button>
                        <button className="block w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 disabled:text-[#91a7bf]" disabled={schedules.length <= 1} onClick={deleteSchedule}>Delete schedule</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {activeEventCount === 0 && <div className="mt-6 flex items-center gap-3 rounded-md border border-[#d9984d] bg-[#ffe6b8] px-5 py-4 text-[15px] font-bold text-[#0b3558]">
                <Info className="size-5 fill-[#0b3558] text-[#ffe6b8]" />
                Apply this saved schedule to at least one event type to use these hours
              </div>}
            </div>

            {view === "list" ? <div>
              <div className="grid min-h-[520px] min-w-[1240px] gap-5 px-4 py-7 pr-12 sm:px-8 sm:py-9 sm:pr-16 xl:grid-cols-[minmax(640px,0.9fr)_minmax(520px,1fr)]">
              <section>
                <div className="mb-7 flex items-start gap-3">
                  <Clock3 className="mt-1 size-5 text-[#0b3558]" />
                  <div>
                    <h2 className="text-[21px] font-bold text-[#0b3558]">Weekly hours</h2>
                    <p className="mt-1 text-[14px] font-medium text-[#6b83a1]">Set when you are typically available for meetings</p>
                  </div>
                </div>

                <div className="grid gap-4">
                  {days.map(([short, label, dayOfWeek]) => {
                    const rule = draft.rules.find((item) => item.dayOfWeek === dayOfWeek);
                    return (
                      <div key={label} className="grid grid-cols-[32px_minmax(0,1fr)] items-center gap-4">
                        <button
                          onClick={() => setDay(dayOfWeek, !rule)}
                          className={cn("grid size-8 place-items-center rounded-full text-[13px] font-bold", rule ? "bg-[#0b3558] text-white" : "bg-[#eef3fb] text-[#55708d]")}
                          title={label}
                        >
                          {short}
                        </button>

                        {!rule ? (
                          <div className="flex items-center gap-5">
                            <span className="w-[110px] text-[15px] font-bold text-[#6b83a1]">Unavailable</span>
                            <button onClick={() => setDay(dayOfWeek, true)} className="grid size-7 place-items-center rounded-full border-2 border-[#6b83a1] text-[#0b3558]">
                              <Plus className="size-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex min-w-0 flex-wrap items-center gap-3">
                            <Input
                              className="h-[44px] w-[136px] shrink-0 border-0 bg-[#f7f8fb] px-3 text-center text-[15px] font-bold text-[#0b3558] shadow-none"
                              type="time"
                              value={rule.startTime}
                              onChange={(event) => updateRule(dayOfWeek, "startTime", event.target.value)}
                            />
                            <span className="text-[#6b83a1]">-</span>
                            <Input
                              className="h-[44px] w-[136px] shrink-0 border-0 bg-[#f7f8fb] px-3 text-center text-[15px] font-bold text-[#0b3558] shadow-none"
                              type="time"
                              value={rule.endTime}
                              onChange={(event) => updateRule(dayOfWeek, "endTime", event.target.value)}
                            />
                            <span className="min-w-[132px] text-sm text-[#6b83a1]">{toDisplayTime(rule.startTime)} - {toDisplayTime(rule.endTime)}</span>
                            <button onClick={() => setDay(dayOfWeek, false)} className="grid size-8 place-items-center rounded-full text-[#55708d] hover:bg-[#eaf3ff]" aria-label={`Remove ${label} hours`}>
                              <X className="size-5" />
                            </button>
                            <button onClick={() => setDay(dayOfWeek, true)} className="grid size-8 place-items-center rounded-full text-[#55708d] hover:bg-[#eaf3ff]" aria-label={`Enable ${label}`}>
                              <Plus className="size-5 rounded-full border-2 border-current p-0.5" />
                            </button>
                            <button className="grid size-8 place-items-center rounded-full text-[#55708d] hover:bg-[#eaf3ff]" onClick={() => copyRuleToWeekdays(rule)} aria-label={`Copy ${label} hours to weekdays`}>
                              <Copy className="size-5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              <section>
                <div className="mb-7 flex items-start justify-between gap-5">
                  <div className="flex items-start gap-3">
                    <Calendar className="mt-1 size-5 text-[#0b3558]" />
                    <div>
                      <h2 className="text-[21px] font-bold text-[#0b3558]">Date-specific hours</h2>
                      <p className="mt-1 text-[15px] font-medium text-[#6b83a1]">Adjust hours for specific days</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="h-10 rounded-full border-[#91a7bf] bg-white px-5 text-[15px] font-bold text-[#0b3558]"
                    onClick={() => setDraft({
                      ...draft,
                      overrides: [...draft.overrides, { date: new Date().toISOString().slice(0, 10), isAvailable: true, startTime: "10:00", endTime: "15:00" }]
                    })}
                  >
                    <Plus className="size-4" />
                    Hours
                  </Button>
                </div>

                <div className="grid gap-3">
                  {draft.overrides.map((override, index) => (
                    <div key={index} className="grid gap-3 rounded-lg border border-[#d7e2ee] p-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Input type="date" value={override.date} onChange={(event) => {
                        const next = [...draft.overrides];
                        next[index] = { ...override, date: event.target.value };
                        setDraft({ ...draft, overrides: next });
                      }} />
                        <select className="h-11 rounded-md border border-[#d7e2ee] px-3 text-sm font-semibold text-[#0b3558]" value={String(override.isAvailable)} onChange={(event) => {
                        const next = [...draft.overrides];
                        next[index] = { ...override, isAvailable: event.target.value === "true" };
                        setDraft({ ...draft, overrides: next });
                      }}>
                          <option value="true">Custom hours</option>
                          <option value="false">Unavailable</option>
                        </select>
                      </div>
                      <div className="flex min-w-0 flex-wrap items-center gap-3">
                        {override.isAvailable && (
                          <>
                            <Input className="h-11 min-w-[132px] flex-1" type="time" value={override.startTime ?? ""} onChange={(event) => {
                            const next = [...draft.overrides];
                            next[index] = { ...override, startTime: event.target.value };
                            setDraft({ ...draft, overrides: next });
                          }} />
                            <Input className="h-11 min-w-[132px] flex-1" type="time" value={override.endTime ?? ""} onChange={(event) => {
                            const next = [...draft.overrides];
                            next[index] = { ...override, endTime: event.target.value };
                            setDraft({ ...draft, overrides: next });
                          }} />
                          </>
                        )}
                        <button
                          className="ml-auto grid size-9 shrink-0 place-items-center rounded-full text-[#55708d] hover:bg-red-50 hover:text-red-600"
                          onClick={() => setDraft({ ...draft, overrides: draft.overrides.filter((_, overrideIndex) => overrideIndex !== index) })}
                          aria-label="Remove date-specific hours"
                        >
                          <Trash2 className="size-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
              </div>
            </div> : (
              <div className="grid min-h-[520px] gap-4 px-4 py-7 sm:px-8 sm:py-9">
                <h2 className="text-[21px] font-bold text-[#0b3558]">Weekly calendar view</h2>
                <div className="grid gap-3 md:grid-cols-7">
                  {days.map(([short, label, dayOfWeek]) => {
                    const rule = draft.rules.find((item) => item.dayOfWeek === dayOfWeek);
                    return (
                      <div key={label} className="min-h-[140px] rounded-lg border border-[#d7e2ee] p-4">
                        <div className="mb-4 flex items-center gap-2">
                          <span className={cn("grid size-8 place-items-center rounded-full text-sm font-bold", rule ? "bg-[#0b3558] text-white" : "bg-[#eef3fb] text-[#55708d]")}>{short}</span>
                          <p className="font-bold text-[#0b3558]">{label}</p>
                        </div>
                        {rule ? (
                          <p className="rounded-md bg-[#f7f8fb] px-3 py-2 text-sm font-bold text-[#31516f]">{toDisplayTime(rule.startTime)} - {toDisplayTime(rule.endTime)}</p>
                        ) : (
                          <p className="text-sm font-semibold text-[#6b83a1]">Unavailable</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end border-t border-[#d7e2ee] px-4 py-5 sm:px-8">
              {message && <p className={cn("mr-auto text-[15px] font-bold", message.includes("saved") ? "text-green-700" : "text-red-600")}>{message}</p>}
              <Button onClick={save} className="h-11 rounded-full px-6 text-[15px] font-bold" disabled={saving}>
                <Save className="size-4" />
                {saving ? "Saving..." : "Save schedule"}
              </Button>
            </div>
          </section>}
        </div>
    </main>
  );
}
