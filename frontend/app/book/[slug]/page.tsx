"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  Globe2,
  Link2,
  Wrench
} from "lucide-react";
import { api, publicBookingUrl } from "@/lib/api";
import { buildMonth, isoDate, monthLabel } from "@/lib/date";
import type { Booking, EventType, Slot } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

function nextBookableDate() {
  const date = new Date();
  date.setDate(date.getDate() + 3);
  while ([0, 6].includes(date.getDay())) date.setDate(date.getDate() + 1);
  return isoDate(date);
}

function displayDate(value: string, timezone = "Asia/Kolkata") {
  return new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: timezone
  }).format(new Date(`${value}T12:00:00`));
}

function displayFullDateTime(start: string, end: string, timezone = "Asia/Kolkata") {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const timeFormat = new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit", timeZone: timezone });
  const dateFormat = new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: timezone });
  return `${timeFormat.format(startDate).toLowerCase()} - ${timeFormat.format(endDate).toLowerCase()}, ${dateFormat.format(startDate)}`;
}

function displayTimeInZone(value: string, timezone: string) {
  return new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit", timeZone: timezone }).format(new Date(value)).toLowerCase();
}

function displayTimezone(timezone: string) {
  const parts = new Intl.DateTimeFormat("en", { timeZone: timezone, timeZoneName: "long" }).formatToParts(new Date());
  return parts.find((part) => part.type === "timeZoneName")?.value ?? timezone;
}

function PublicCalendar({
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
  const today = new Date(new Date().toDateString());

  return (
    <section>
      <div className="mb-7 flex items-center justify-center gap-10">
        <button className="grid size-10 place-items-center text-[#6b83a1]" onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="Previous month">
          <ChevronLeft className="size-5" />
        </button>
        <strong className="min-w-[118px] text-center text-[17px] font-bold text-[#31516f]">{monthLabel(month)}</strong>
        <button className="grid size-11 place-items-center rounded-full bg-[#eef5ff] text-[#006bff]" onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="Next month">
          <ChevronRight className="size-6" />
        </button>
      </div>
      <div className="grid grid-cols-7 text-center text-[13px] font-bold uppercase text-[#0b3558]">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className="mt-4 grid grid-cols-7 gap-y-5 text-center">
        {days.slice(1).concat(days.slice(0, 1)).map((day) => {
          const value = isoDate(day);
          const disabled = day.getMonth() !== month.getMonth() || day < today;
          const isSelected = selected === value;
          const isBookable = !disabled && ![0, 6].includes(day.getDay());
          return (
            <button
              key={value}
              className={cn(
                "mx-auto grid size-11 place-items-center rounded-full text-[17px] font-bold text-[#777] transition disabled:cursor-not-allowed disabled:text-[#b8b8b8]",
                isBookable && "bg-[#eef5ff] text-[#006bff] hover:bg-[#dcebff]",
                isSelected && "bg-[#006bff] text-white hover:bg-[#006bff]"
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

export default function BookingPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const initialDate = useMemo(() => nextBookableDate(), []);
  const [eventType, setEventType] = useState<EventType | null>(null);
  const [month, setMonth] = useState(() => new Date(`${initialDate}T12:00:00`));
  const [date, setDate] = useState(initialDate);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [form, setForm] = useState({ inviteeName: "", inviteeEmail: "", answers: {} as Record<string, string> });
  const [message, setMessage] = useState("");
  const [rescheduleToken, setRescheduleToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [timezone, setTimezone] = useState("Asia/Kolkata");

  const bookingUrl = useMemo(() => publicBookingUrl(params.slug), [params.slug]);
  const timezoneOptions = useMemo(() => Array.from(new Set([
    eventType?.schedule?.timezone,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    "Asia/Kolkata",
    "UTC",
    "America/New_York",
    "Europe/London"
  ].filter(Boolean))) as string[], [eventType?.schedule?.timezone]);

  useEffect(() => {
    api<EventType>(`/public/${params.slug}`).then(setEventType).catch((error) => setMessage(error.message));
  }, [params.slug]);

  useEffect(() => {
    if (eventType?.schedule?.timezone) setTimezone(eventType.schedule.timezone);
  }, [eventType?.schedule?.timezone]);

  useEffect(() => {
    setSelectedSlot(null);
    api<Slot[]>(`/public/${params.slug}/slots?date=${date}`).then(setSlots).catch(() => setSlots([]));
  }, [params.slug, date]);

  useEffect(() => {
    const reschedule = new URLSearchParams(window.location.search).get("reschedule");
    if (!reschedule) return;
    setRescheduleToken(reschedule);
    setMessage("Pick a new time to reschedule. Your previous meeting will be cancelled after the new time is confirmed.");
    api<Booking>(`/reschedule/${reschedule}`).then((booking) => {
      setForm({
        inviteeName: booking.inviteeName,
        inviteeEmail: booking.inviteeEmail,
        answers: Object.fromEntries((booking.answers ?? []).map((answer) => [answer.questionId, answer.answer]))
      });
    }).catch((error) => setMessage(error.message));
  }, []);

  async function copyLink() {
    await navigator.clipboard?.writeText(bookingUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  async function book(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedSlot || !eventType) return;
    try {
      const booking = await api<{ id: string }>(rescheduleToken ? `/reschedule/${rescheduleToken}` : `/public/${params.slug}/bookings`, {
        method: "POST",
        body: JSON.stringify({
          inviteeName: form.inviteeName,
          inviteeEmail: form.inviteeEmail,
          startTime: selectedSlot.startTime,
          timezone,
          answers: eventType.customQuestions.map((question) => ({
            questionId: question.id,
            answer: form.answers[question.id] ?? ""
          }))
        })
      });
      router.push(`/confirmation/${booking.id}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to book");
    }
  }

  return (
    <main className="min-h-screen bg-[#fbfbfc]">
      <header className="sticky top-0 z-20 h-[58px] border-b border-[#d7e2ee] bg-white shadow-[0_8px_22px_rgba(11,53,88,0.08)]">
        <div className="mx-auto flex h-full max-w-[1160px] items-center justify-end gap-5 px-4">
          <Button variant="outline" className="h-11 rounded-full border-[#91a7bf] bg-white px-5 text-[15px] font-bold text-[#0b3558]" onClick={copyLink}>
            {copied ? <Copy className="size-4" /> : <Link2 className="size-4" />}
            {copied ? "Copied" : "Copy link"}
          </Button>
        </div>
      </header>

      <section className="px-4 py-16 lg:py-[72px]">
        <div className="relative mx-auto grid min-h-[750px] max-w-[1140px] overflow-hidden rounded-lg border border-[#d7e2ee] bg-white shadow-[0_2px_10px_rgba(11,53,88,0.12)] lg:grid-cols-[400px_1fr]">
          <div className="absolute right-0 top-0 z-10 h-[104px] w-[104px] overflow-hidden rounded-tr-lg">
            <div className="absolute right-[-41px] top-[25px] flex h-[34px] w-[150px] rotate-45 items-center justify-center bg-[#4b555f] text-center text-[10px] font-bold uppercase leading-[11px] text-white shadow-md">
              <span>Powered by<br />Calendly</span>
            </div>
          </div>

          <aside className="flex flex-col border-b border-[#d7e2ee] p-8 lg:border-b-0 lg:border-r lg:p-10">
            {selectedSlot && (
              <button className="mb-8 grid size-12 place-items-center rounded-full border border-[#d7e2ee] text-[#006bff]" onClick={() => setSelectedSlot(null)} aria-label="Back to date and time selection">
                <ArrowLeft className="size-6" />
              </button>
            )}
            <p className="text-[17px] font-bold text-[#777]">{eventType?.user?.name ?? "Yash Agarwal"}</p>
            <h1 className="mt-2 text-[30px] font-bold leading-tight tracking-normal text-[#0b0f1a]">{eventType?.name ?? "Loading..."}</h1>
            <div className="mt-8 grid gap-5 text-[15px] font-bold text-[#0b3558]">
              <span className="inline-flex items-center gap-3"><Clock3 className="size-5" />{eventType?.durationMinutes ?? 30} min</span>
              {selectedSlot && (
                <>
                  <span className="inline-flex items-start gap-3"><CalendarDays className="mt-0.5 size-5" />{displayFullDateTime(selectedSlot.startTime, selectedSlot.endTime, timezone)}</span>
                  <span className="inline-flex items-center gap-3"><Globe2 className="size-5" />{displayTimezone(timezone)}</span>
                </>
              )}
            </div>
            <div className="mt-auto hidden gap-9 text-[15px] font-bold text-[#006bff] lg:flex">
              <button className="border-b-2 border-transparent transition hover:border-[#006bff]">Cookie settings</button>
              <button className="border-b-2 border-transparent transition hover:border-[#006bff]">Privacy Policy</button>
            </div>
          </aside>

          {!selectedSlot ? (
            <section className="grid gap-7 p-8 lg:grid-cols-[1fr_290px] lg:p-10">
              <div>
                <h2 className="mb-10 text-[24px] font-bold tracking-normal text-[#0b3558]">Select a Date & Time</h2>
                <PublicCalendar month={month} selected={date} onMonthChange={setMonth} onSelect={setDate} />
                <div className="mt-9">
                  <p className="text-[15px] font-bold text-[#0b3558]">Time zone</p>
                  <label className="mt-4 flex items-center gap-3 text-[15px] font-bold text-[#31516f]">
                    <Globe2 className="size-5" />
                    <select
                      className="max-w-[260px] bg-transparent font-bold outline-none hover:text-[#006bff]"
                      value={timezone}
                      onChange={(event) => setTimezone(event.target.value)}
                    >
                      {timezoneOptions.map((option) => (
                        <option key={option} value={option}>
                          {displayTimezone(option)} ({new Date().toLocaleTimeString("en", { hour: "numeric", minute: "2-digit", timeZone: option }).toLowerCase()})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="size-4" />
                  </label>
                </div>
                <Button variant="outline" className="mt-32 h-12 rounded-full border-[#91a7bf] bg-white px-6 text-[15px] font-bold text-[#0b3558]">
                  <Wrench className="size-5" />
                  Troubleshoot
                </Button>
              </div>

              <div className="min-w-0">
                <h3 className="mb-8 text-[17px] font-semibold text-[#31516f]">{displayDate(date, timezone)}</h3>
                <div className="max-h-[590px] overflow-y-auto pr-2">
                  <div className="grid gap-3">
                    {slots.map((slot) => (
                      <button
                        key={slot.startTime}
                        className="h-[58px] rounded border border-[#9bc8ff] bg-white text-[17px] font-bold text-[#006bff] transition hover:border-[#006bff] hover:bg-[#f6fbff]"
                        onClick={() => setSelectedSlot(slot)}
                      >
                        {displayTimeInZone(slot.startTime, timezone)}
                      </button>
                    ))}
                    {!slots.length && <p className="rounded-lg bg-[#f6f8fb] p-4 text-sm font-semibold text-[#6b83a1]">No times available for this date.</p>}
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <form className="p-8 lg:p-10" onSubmit={book}>
              <div className="max-w-[430px]">
                <h2 className="text-[24px] font-bold tracking-normal text-[#0b3558]">Enter Details</h2>
                {message && <div className="mt-4 rounded-lg bg-blue-50 p-4 text-sm font-semibold text-[#006bff]">{message}</div>}
                <div className="mt-3 grid gap-2">
                  <Label className="font-bold text-[#0b3558]">Name *</Label>
                  <Input className="h-11 border-[#c5d2e0]" value={form.inviteeName} onChange={(event) => setForm({ ...form, inviteeName: event.target.value })} required />
                </div>
                <div className="mt-6 grid gap-2">
                  <Label className="font-bold text-[#0b3558]">Email *</Label>
                  <Input className="h-11 border-[#c5d2e0]" type="email" value={form.inviteeEmail} onChange={(event) => setForm({ ...form, inviteeEmail: event.target.value })} required />
                </div>
                <Button type="button" variant="outline" className="mt-4 h-9 rounded-full border-[#006bff] bg-white px-4 text-[15px] font-bold text-[#006bff]">Add Guests</Button>

                {(eventType?.customQuestions.length ? eventType.customQuestions : [{ id: "fallback", label: "Please share anything that will help prepare for our meeting.", required: false }]).map((question) => (
                  <div className="mt-7 grid gap-2" key={question.id}>
                    <Label className="font-bold text-[#0b3558]">{question.label}{question.required ? " *" : ""}</Label>
                    <Textarea
                      className="min-h-[64px] border-[#c5d2e0]"
                      required={question.required}
                      value={form.answers[question.id] ?? ""}
                      onChange={(event) => setForm({
                        ...form,
                        answers: { ...form.answers, [question.id]: event.target.value }
                      })}
                    />
                  </div>
                ))}

                <p className="mt-8 text-[15px] font-semibold leading-6 text-[#31516f]">
                  By proceeding, you confirm that you have read and agree to <span className="font-bold text-[#006bff]">Calendly&apos;s Invitee Terms</span> and <span className="font-bold text-[#006bff]">Privacy Notice.</span>
                </p>
                <Button className="mt-7 h-12 rounded-full px-7 text-[16px] font-bold">{rescheduleToken ? "Reschedule Event" : "Schedule Event"}</Button>
              </div>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
