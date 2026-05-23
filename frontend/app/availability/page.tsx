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
  Users,
  X
} from "lucide-react";
import { api } from "@/lib/api";
import type { AvailabilityRule, DateOverride, Schedule } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  const [selectedId, setSelectedId] = useState("");
  const selected = useMemo(() => schedules.find((schedule) => schedule.id === selectedId), [schedules, selectedId]);
  const [draft, setDraft] = useState({ name: "Working hours", timezone: "Asia/Kolkata", isDefault: true, rules: defaultRules, overrides: [] as DateOverride[] });

  async function load() {
    const data = await api<Schedule[]>("/availability");
    setSchedules(data);
    setSelectedId(data[0]?.id ?? "");
    if (data[0]) {
      setDraft({
        name: data[0].name,
        timezone: data[0].timezone,
        isDefault: data[0].isDefault,
        rules: data[0].rules,
        overrides: data[0].overrides.map((item) => ({ ...item, date: String(item.date).slice(0, 10) }))
      });
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

  async function save() {
    if (selectedId) {
      await api(`/availability/${selectedId}`, { method: "PUT", body: JSON.stringify(draft) });
    } else {
      await api("/availability", { method: "POST", body: JSON.stringify(draft) });
    }
    await load();
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
          <div className="mb-9 flex flex-col gap-4 rounded-lg border border-[#5d9cff] bg-[#eaf3ff] px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-[15px] font-bold text-[#0b3558]">Review our updated Terms of Use</p>
              <p className="mt-1 text-[15px] font-medium text-[#31516f]">We&apos;ve updated our Terms of Use to reflect how Calendly works today. Take a moment to review what&apos;s changed.</p>
            </div>
            <div className="flex shrink-0 items-center gap-4">
              <button className="text-[15px] font-bold text-[#0b3558]">Review terms</button>
              <Button className="h-10 rounded-full px-5 font-bold">Accept terms</Button>
            </div>
          </div>

          <div className="mb-7">
            <h1 className="text-[26px] font-bold tracking-normal text-[#0b3558]">Availability</h1>
            <div className="mt-7 flex gap-6 overflow-x-auto border-b border-[#d7e2ee] text-[15px] font-bold text-[#55708d] sm:gap-9">
              <button className="border-b-[3px] border-[#006bff] pb-5 text-[#0b3558]">Schedules</button>
              <button className="pb-5">Calendar settings</button>
              <button className="pb-5">Advanced settings</button>
            </div>
          </div>

          <section className="overflow-hidden rounded-lg border border-[#d7e2ee] bg-white">
            <div className="border-b border-[#d7e2ee] px-4 py-7 sm:px-8 sm:py-9">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <p className="text-[15px] font-bold text-[#55708d]">Schedule</p>
                  <div className="mt-3 flex items-center gap-2">
                    <select
                      className="max-w-[360px] bg-transparent text-[21px] font-bold text-[#005bcf] outline-none"
                      value={selectedId}
                      onChange={(event) => setSelectedId(event.target.value)}
                    >
                      {schedules.map((schedule) => (
                        <option key={schedule.id} value={schedule.id}>
                          {schedule.name}{schedule.isDefault ? " (default)" : ""}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="size-4 text-[#005bcf]" />
                  </div>
                  <div className="mt-5 flex items-center gap-2 text-[15px] font-bold text-[#0b3558]">
                    <span>Active on:</span>
                    <Info className="size-5 fill-[#0b3558] text-white" />
                    <span className="text-[#006bff]">0 event types</span>
                    <ChevronDown className="size-4 text-[#006bff]" />
                  </div>
                </div>

                <div className="flex items-center gap-5">
                  <div className="flex rounded-lg bg-[#eaf1fa] p-1">
                    <button className="flex h-10 items-center gap-2 rounded-md bg-white px-4 text-[15px] font-bold text-[#0b3558] shadow-md">
                      <List className="size-5" />
                      List
                    </button>
                    <button className="flex h-10 items-center gap-2 rounded-md px-4 text-[15px] font-bold text-[#55708d]">
                      <Calendar className="size-5" />
                      Calendar
                    </button>
                  </div>
                  <MoreVertical className="size-6 text-[#0b3558]" />
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3 rounded-md border border-[#d9984d] bg-[#ffe6b8] px-5 py-4 text-[15px] font-bold text-[#0b3558]">
                <Info className="size-5 fill-[#0b3558] text-[#ffe6b8]" />
                Apply this saved schedule to at least one event type to use these hours
              </div>
            </div>

            <div className="grid min-h-[520px] gap-10 px-4 py-7 sm:px-8 sm:py-9 xl:grid-cols-[600px_1fr]">
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
                      <div key={label} className="grid grid-cols-[32px_1fr] items-center gap-4">
                        <button
                          onClick={() => setDay(dayOfWeek, !rule)}
                          className="grid size-8 place-items-center rounded-full bg-[#0b3558] text-[13px] font-bold text-white"
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
                          <div className="flex items-center gap-3">
                            <Input
                              className="h-[44px] w-[104px] border-0 bg-[#f7f8fb] text-center text-[15px] font-bold text-[#0b3558] shadow-none"
                              type="time"
                              value={rule.startTime}
                              onChange={(event) => updateRule(dayOfWeek, "startTime", event.target.value)}
                            />
                            <span className="text-[#6b83a1]">-</span>
                            <Input
                              className="h-[44px] w-[104px] border-0 bg-[#f7f8fb] text-center text-[15px] font-bold text-[#0b3558] shadow-none"
                              type="time"
                              value={rule.endTime}
                              onChange={(event) => updateRule(dayOfWeek, "endTime", event.target.value)}
                            />
                            <span className="hidden text-sm text-[#6b83a1] md:inline">{toDisplayTime(rule.startTime)} - {toDisplayTime(rule.endTime)}</span>
                            <button onClick={() => setDay(dayOfWeek, false)} className="grid size-8 place-items-center text-[#55708d]">
                              <X className="size-5" />
                            </button>
                            <button onClick={() => setDay(dayOfWeek, true)} className="grid size-8 place-items-center text-[#55708d]">
                              <Plus className="size-5 rounded-full border-2 border-current p-0.5" />
                            </button>
                            <button className="grid size-8 place-items-center text-[#55708d]">
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
                    <div key={index} className="grid gap-3 rounded-lg border border-[#d7e2ee] p-4 lg:grid-cols-[160px_170px_1fr]">
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
                      {override.isAvailable && (
                        <div className="flex flex-wrap items-center gap-3">
                          <Input className="w-32" type="time" value={override.startTime ?? ""} onChange={(event) => {
                            const next = [...draft.overrides];
                            next[index] = { ...override, startTime: event.target.value };
                            setDraft({ ...draft, overrides: next });
                          }} />
                          <Input className="w-32" type="time" value={override.endTime ?? ""} onChange={(event) => {
                            const next = [...draft.overrides];
                            next[index] = { ...override, endTime: event.target.value };
                            setDraft({ ...draft, overrides: next });
                          }} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="flex justify-end border-t border-[#d7e2ee] px-4 py-5 sm:px-8">
              <Button onClick={save} className="h-11 rounded-full px-6 text-[15px] font-bold">
                <Save className="size-4" />
                Save schedule
              </Button>
            </div>
          </section>
        </div>
    </main>
  );
}
