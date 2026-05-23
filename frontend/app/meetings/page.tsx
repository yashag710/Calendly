"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Download,
  ExternalLink,
  Filter,
  Flag,
  HelpCircle,
  Info,
  NotebookPen,
  RefreshCcw,
  Search,
  Trash2,
  Users
} from "lucide-react";
import { api } from "@/lib/api";
import type { Booking } from "@/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function formatMeetingDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata"
  }).format(new Date(value));
}

function formatMeetingTime(start: string, end: string) {
  const options: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" };
  return `${new Intl.DateTimeFormat("en", options).format(new Date(start)).toLowerCase()} – ${new Intl.DateTimeFormat("en", options).format(new Date(end)).toLowerCase()}`;
}

function calendarDate(value?: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata"
  }).format(new Date(value));
}

function csvEscape(value: string | number | null | undefined) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll("\"", "\"\"")}"` : text;
}

function exportMeetingsCsv(meetings: Booking[]) {
  const headers = ["Invitee", "Email", "Event type", "Start time", "End time", "Timezone", "Status", "Host"];
  const rows = meetings.map((meeting) => [
    meeting.inviteeName,
    meeting.inviteeEmail,
    meeting.eventType.name,
    meeting.startTime,
    meeting.endTime,
    meeting.timezone,
    meeting.status,
    meeting.user?.name ?? ""
  ]);
  const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `calendly-meetings-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function UnderlineText({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("border-b-2 border-transparent leading-5 group-hover:border-[#006bff]", className)}>
      {children}
    </span>
  );
}

function DetailsArrow({ open }: { open: boolean }) {
  return open ? (
    <span className="h-0 w-0 border-x-[8px] border-t-[10px] border-x-transparent border-t-[#55708d]" />
  ) : (
    <span className="h-0 w-0 border-y-[8px] border-l-[10px] border-y-transparent border-l-[#55708d]" />
  );
}

function ParticipantPopover({
  type,
  count,
  user
}: {
  type: "hosts" | "non-hosts";
  count: number;
  user?: Booking["user"];
}) {
  const title = type === "hosts" ? "HOSTS" : "NON-HOSTS";

  return (
    <div className="invisible absolute left-0 top-7 z-40 w-[270px] rounded-md border border-[#d7e2ee] bg-white p-5 text-left opacity-0 shadow-[0_3px_12px_rgba(11,53,88,0.18)] transition group-hover:visible group-hover:opacity-100">
      <p className="mb-5 text-[15px] font-bold text-[#006bff]">{title}</p>
      {type === "hosts" && count > 0 && (
        <div className="mb-5 flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-[#eef3fb] text-sm font-bold text-[#0b3558]">
            {(user?.name ?? "Yash Agarwal").charAt(0)}
          </span>
          <span className="font-bold text-[#3378d8]">{user?.name ?? "Yash Agarwal"}</span>
        </div>
      )}
      <Button variant="outline" className="h-9 w-full rounded-full border-[#006bff] bg-white text-[15px] font-bold text-[#3378d8] hover:bg-[#eef6ff]">
        See details
      </Button>
    </div>
  );
}

function CalendarDropdown({ open }: { open: boolean }) {
  if (!open) return null;

  return (
    <div className="absolute left-0 top-[58px] z-50 w-[310px] overflow-hidden rounded-md border border-[#d7e2ee] bg-white shadow-[0_3px_12px_rgba(11,53,88,0.18)]">
      <div className="flex h-[62px] items-center gap-3 px-4 text-[#6b83a1]">
        <Search className="size-5" />
        <span className="text-[15px] font-semibold">Filter</span>
      </div>
      <div className="h-[230px] border-b border-[#d7e2ee]" />
      <div className="p-6 text-[15px] leading-6 text-[#0b3558]">
        <p className="font-bold">Work together with a Calendly organization</p>
        <p className="mt-3 font-semibold">
          When you add users to your Calendly organization you can create Team Pages, Team Event Types, and much more.
        </p>
        <button className="group mt-3 block font-bold text-[#006bff]">
          <UnderlineText>Visit your Users page to learn more</UnderlineText>
        </button>
        <button className="group mt-3 block font-bold text-[#006bff]">
          <UnderlineText>Add seats</UnderlineText>
        </button>
      </div>
    </div>
  );
}

function FilterRow() {
  const filters = [
    ["Teams", "All Teams"],
    ["Host", "Host"],
    ["Event Types", "All Event Types"],
    ["Status", "Active Events"],
    ["Tracking ID", "All IDs"],
    ["Invitee Emails", "All Invitee Emails"]
  ];

  return (
    <div className="grid gap-5 border-b border-[#d7e2ee] px-7 py-5 text-[15px] font-bold text-[#55708d] md:grid-cols-3 xl:grid-cols-[1fr_1fr_1.45fr_1.25fr_1.2fr_1.55fr_auto]">
      {filters.map(([label, value]) => (
        <button key={label} className="group text-left">
          <span className="block text-[14px] text-[#55708d]">{label}</span>
          <span className="mt-2 flex items-center gap-1 text-[16px] text-[#006bff]"><UnderlineText>{value}</UnderlineText><ChevronDown className="size-4" /></span>
        </button>
      ))}
      <button className="group self-end whitespace-nowrap text-left text-[16px] font-bold text-[#006bff]"><UnderlineText>Clear all filters</UnderlineText></button>
    </div>
  );
}

function DateRangePopover({ onApply }: { onApply: (range: { from: string; to: string }) => void }) {
  const mayDays = Array.from({ length: 31 }, (_, index) => index + 1);
  const juneDays = Array.from({ length: 30 }, (_, index) => index + 1);

  return (
    <div className="absolute left-0 top-[54px] z-30 w-[760px] rounded-md border border-[#d7e2ee] bg-white p-7 shadow-xl max-lg:w-[calc(100vw-2rem)]">
      <div className="mb-9 flex gap-7 text-[16px] font-bold text-[#006bff]">
        {["Today", "This week", "This month", "All time"].map((label) => (
          <button key={label} className="group"><UnderlineText>{label}</UnderlineText></button>
        ))}
      </div>
      <div className="grid gap-12 md:grid-cols-2">
        {[
          ["May 2026", mayDays],
          ["June 2026", juneDays]
        ].map(([month, days], monthIndex) => (
          <div key={String(month)}>
            <div className="mb-7 flex items-center justify-between">
              {monthIndex === 0 ? <ChevronLeft className="size-6 text-[#31516f]" /> : <span />}
              <h3 className="text-[21px] font-bold text-[#0b3558]">{String(month)}</h3>
              {monthIndex === 1 ? <ChevronRight className="size-6 text-[#31516f]" /> : <span />}
            </div>
            <div className="grid grid-cols-7 gap-y-6 text-center text-[15px] font-bold text-[#0b3558]">
              {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => <span className="text-[13px] text-[#55708d]" key={day}>{day}</span>)}
              {(days as number[]).map((day) => (
                <button key={day} className={cn("mx-auto grid size-10 place-items-center rounded-full", monthIndex === 0 && day === 22 && "bg-[#006bff] text-white")}>{day}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-12 flex justify-end gap-8">
        <button className="rounded-full px-5 text-[16px] font-bold text-[#0b3558] hover:bg-[#eef6ff]">Cancel</button>
        <Button
          className="h-12 rounded-full px-7 text-[16px] font-bold"
          onClick={() => onApply({
            from: new Date("2026-05-01T00:00:00.000Z").toISOString(),
            to: new Date("2026-06-30T23:59:59.999Z").toISOString()
          })}
        >
          Apply
        </Button>
      </div>
    </div>
  );
}

function EmptyCalendarGraphic() {
  return (
    <div className="relative mx-auto mb-5 h-[105px] w-[128px]">
      <div className="absolute bottom-0 left-0 h-[84px] w-[112px] rounded border-4 border-[#b7b7b7] bg-white">
        <div className="h-7 border-b-4 border-[#b7b7b7] bg-[#e8e8e8]" />
        <div className="grid grid-cols-5 grid-rows-3 gap-px p-2">
          {Array.from({ length: 15 }).map((_, index) => <span key={index} className="h-5 border border-[#ddd]" />)}
        </div>
      </div>
      <div className="absolute right-0 top-0 grid size-12 place-items-center rounded-full bg-[#999] text-2xl font-bold text-white">0</div>
    </div>
  );
}

export default function MeetingsPage() {
  const [period, setPeriod] = useState<"upcoming" | "past" | "range">("upcoming");
  const [meetings, setMeetings] = useState<Booking[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: string; to: string } | null>(null);

  async function load(nextPeriod = period) {
    const params = new URLSearchParams({ period: nextPeriod });
    if (nextPeriod === "range" && dateRange) {
      params.set("from", dateRange.from);
      params.set("to", dateRange.to);
    }
    setMeetings(await api<Booking[]>(`/meetings?${params.toString()}`));
  }

  useEffect(() => {
    load(period);
  }, [period, dateRange]);

  const visibleMeetings = useMemo(() => {
    if (period === "past") return [];
    return meetings;
  }, [meetings, period]);
  const activeMeeting = visibleMeetings[0];
  const hostCount = activeMeeting?.user ? 1 : activeMeeting ? 1 : 0;
  const nonHostCount = 0;

  return (
    <main className="min-h-screen bg-[#fbfbfc]">
      <header className="hidden h-[86px] items-center justify-end bg-white px-8 lg:flex">
        <div className="flex items-center gap-6">
          <Users className="size-5 text-[#0b3558]" />
          <button className="grid size-10 place-items-center rounded-full bg-[#eef3fb] text-sm font-bold text-[#0b3558]">Y</button>
          <ChevronDown className="size-4 text-[#0b3558]" />
        </div>
      </header>

      <section className="mx-auto max-w-[1490px] px-4 pb-16 pt-8 sm:px-8 lg:pt-10">
        <h1 className="flex items-center gap-2 border-b border-[#d7e2ee] pb-7 text-[28px] font-bold tracking-normal text-[#0b3558]">
          Meetings
          <HelpCircle className="size-5" />
        </h1>

        <div className="mt-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Button
                variant="outline"
                className="h-12 rounded-lg border-[#c5d2e0] bg-white px-5 text-[16px] font-semibold text-[#0b3558] hover:bg-[#eef6ff]"
                onClick={() => setCalendarOpen((value) => !value)}
              >
                My Calendly
                {calendarOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              </Button>
              <CalendarDropdown open={calendarOpen} />
            </div>
            <span className="text-[16px] font-bold text-[#0b3558]">Show buffers</span>
            <Info className="size-5 text-[#55708d]" />
            <button className="relative h-5 w-10 rounded-full bg-[#006bff]">
              <span className="absolute right-0 top-1/2 size-5 -translate-y-1/2 rounded-full bg-white shadow" />
            </button>
          </div>
          <p className="text-[16px] font-semibold text-[#6b83a1]">
            {visibleMeetings.length ? `Displaying ${visibleMeetings.length} of ${visibleMeetings.length} Events` : "Displaying 0 of 0 Events"}
          </p>
        </div>

        <section className="relative mt-8 overflow-visible rounded-lg border border-[#d7e2ee] bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-[#d7e2ee] px-7 py-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative flex flex-wrap gap-8 text-[16px] font-bold text-[#55708d]">
              <button
                className={cn("group pb-5", period === "upcoming" && !dateOpen && "border-b-[4px] border-[#006bff] text-[#0b3558]")}
                onClick={() => {
                  setPeriod("upcoming");
                  setDateOpen(false);
                  setDateRange(null);
                }}
              >
                <UnderlineText>Upcoming</UnderlineText>
              </button>
              <button
                className={cn("group pb-5", period === "past" && "border-b-[4px] border-[#006bff] text-[#0b3558]")}
                onClick={() => {
                  setPeriod("past");
                  setDateOpen(false);
                  setDateRange(null);
                }}
              >
                <UnderlineText>Past</UnderlineText>
              </button>
              <button
                className={cn("group flex items-center gap-1 pb-5", dateOpen && "border-b-[4px] border-[#91a7bf] text-[#0b3558]")}
                onClick={() => setDateOpen((value) => !value)}
              >
                <UnderlineText>Date Range</UnderlineText> {dateOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              </button>
              {dateOpen && <DateRangePopover onApply={(range) => {
                setDateRange(range);
                setPeriod("range");
                setDateOpen(false);
              }} />}
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="h-10 rounded-full border-[#91a7bf] bg-white px-4 text-[16px] font-bold text-[#0b3558] hover:bg-[#eef6ff]"
                onClick={() => exportMeetingsCsv(visibleMeetings)}
                disabled={!visibleMeetings.length}
              >
                <Download className="size-5" />
                Export
              </Button>
              <Button variant="outline" className="h-10 rounded-full border-[#91a7bf] bg-white px-4 text-[16px] font-bold text-[#0b3558] hover:bg-[#eef6ff]" onClick={() => setFiltersOpen((value) => !value)}>
                <Filter className="size-5" />
                Filter {filtersOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              </Button>
            </div>
          </div>

          {filtersOpen && <FilterRow />}

          {period === "past" ? (
            <div className="grid min-h-[315px] place-items-center">
              <div className="text-center">
                <EmptyCalendarGraphic />
                <h2 className="text-[28px] font-bold text-[#31516f]">No Past Events</h2>
              </div>
            </div>
          ) : !activeMeeting ? (
            <div className="grid min-h-[315px] place-items-center">
              <div className="text-center">
                <EmptyCalendarGraphic />
                <h2 className="text-[28px] font-bold text-[#31516f]">No Events</h2>
              </div>
            </div>
          ) : (
            <>
              <div className="border-b border-[#d7e2ee] px-7 py-5 text-[17px] font-bold text-[#0b3558]">
                {formatMeetingDate(activeMeeting.startTime)}
              </div>

              <div
                className={cn("grid w-full cursor-pointer gap-6 border-b border-[#d7e2ee] px-7 py-8 text-left transition md:grid-cols-[340px_1fr_260px_120px]", detailsOpen && "items-start")}
                onClick={() => setDetailsOpen((value) => !value)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") setDetailsOpen((value) => !value);
                }}
              >
                <div className="flex items-center gap-7">
                  <span className="size-10 rounded-full bg-[#8247f5]" />
                  <span className="text-[17px] font-semibold text-[#0b3558]">{formatMeetingTime(activeMeeting.startTime, activeMeeting.endTime)}</span>
                </div>
                <div>
                  <p className="text-[17px] font-bold text-[#0b3558]">{activeMeeting.inviteeName || "Yash"}</p>
                  <p className="mt-1 text-[17px] font-semibold text-[#31516f]">Event type <span className="font-bold text-[#0b3558]">{activeMeeting.eventType.name}</span></p>
                </div>
                <div className="relative flex items-start text-[17px] font-semibold text-[#0b3558]" onClick={(event) => event.stopPropagation()}>
                  <span className="group relative">
                    <button className="group border-b-2 border-transparent hover:border-[#006bff]">{hostCount} {hostCount === 1 ? "host" : "hosts"}</button>
                    <ParticipantPopover type="hosts" count={hostCount} user={activeMeeting.user} />
                  </span>
                  <span className="mx-1 text-[#6b83a1]">|</span>
                  <span className="group relative">
                    <button className="group border-b-2 border-transparent hover:border-[#006bff]">{nonHostCount} non-hosts</button>
                    <ParticipantPopover type="non-hosts" count={nonHostCount} user={activeMeeting.user} />
                  </span>
                </div>
                <button className="flex items-center justify-end gap-2 text-[17px] font-bold text-[#55708d]" onClick={(event) => {
                  event.stopPropagation();
                  setDetailsOpen((value) => !value);
                }}>
                  <DetailsArrow open={detailsOpen} />
                  Details
                </button>
              </div>

              {detailsOpen && (
                <div className="grid gap-8 border-b border-[#d7e2ee] px-7 py-8 lg:grid-cols-[340px_1fr]">
                  <aside className="grid content-start gap-5 pl-12">
                    <Button asChild variant="outline" className="h-12 rounded-full border-[#91a7bf] bg-white text-[16px] font-bold text-[#0b3558] hover:bg-[#eef6ff]">
                      <Link href={`/book/${activeMeeting.eventType.slug}?reschedule=${activeMeeting.rescheduleToken}`}>
                        <RefreshCcw className="size-5" />
                        Reschedule
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-12 rounded-full border-[#91a7bf] bg-white text-[16px] font-bold text-[#0b3558] hover:bg-[#eef6ff]"
                      onClick={async () => {
                        if (activeMeeting.id !== "preview") {
                          await api(`/meetings/${activeMeeting.id}/cancel`, { method: "PATCH", body: JSON.stringify({ reason: "Cancelled from dashboard" }) });
                          await load();
                        }
                      }}
                    >
                      <Trash2 className="size-5" />
                      Cancel
                    </Button>
                    <Link href={`/event-types/${activeMeeting.eventType.id}`} target="_blank" rel="noopener noreferrer" className="group mt-5 flex items-center gap-3 text-[17px] font-bold text-[#006bff]"><ExternalLink className="size-5" /><UnderlineText>Edit Event Type</UnderlineText></Link>
                    <button className="group flex items-center gap-3 text-[17px] font-bold text-[#006bff]"><Filter className="size-5" /><UnderlineText>Filter by Event Type</UnderlineText></button>
                    <button className="group flex items-center gap-3 text-[17px] font-bold text-[#006bff]"><Flag className="size-5" /><UnderlineText>Report this event</UnderlineText></button>
                  </aside>

                  <section className="max-w-[640px] text-[17px] text-[#0b3558]">
                    <p className="mb-4 text-sm font-bold uppercase text-[#0b3558]">Invitee</p>
                    <div className="mb-4 flex items-center gap-3">
                      <span className="grid size-10 place-items-center rounded-full bg-[#eef3fb] text-sm font-bold">Y</span>
                      <div>
                        <p className="font-bold">{activeMeeting.inviteeName || "Yash"}</p>
                        <p className="text-[#6b83a1]">{activeMeeting.inviteeEmail || "jyashag710@gmail.com"}</p>
                      </div>
                    </div>
                    <div className="mb-8 flex gap-7">
                      <button className="group font-bold text-[#006bff]"><UnderlineText>Edit email</UnderlineText></button>
                      <button className="group font-bold text-[#006bff]"><UnderlineText>View contact</UnderlineText></button>
                    </div>
                    <p className="mb-3 text-sm font-bold uppercase">Location</p>
                    <p className="mb-8">This is a Google Meet web conference. <button className="group text-[#006bff]"><UnderlineText>Join now</UnderlineText></button></p>
                    <p className="mb-3 text-sm font-bold uppercase">Invitee time zone</p>
                    <p className="mb-8">Eastern Time - US & Canada</p>
                    <p className="mb-3 text-sm font-bold uppercase">Meeting host</p>
                    <p className="mb-5 text-[#6b83a1]">Host will attend this meeting</p>
                    <span className="grid size-10 place-items-center rounded-full bg-[#eef3fb] text-sm font-bold">{(activeMeeting.user?.name ?? "Yash").charAt(0)}</span>
                    <button className="group mt-10 flex items-center gap-2 font-bold text-[#006bff]"><NotebookPen className="size-5" /><UnderlineText>Add meeting notes</UnderlineText></button>
                    <p className="mt-4 text-[#6b83a1]">(only the host will see these)</p>
                    <p className="mt-8 text-[#6b83a1]">Created {calendarDate(activeMeeting.createdAt) || calendarDate(activeMeeting.startTime)} by {activeMeeting.user?.name ?? "Yash Agarwal"}</p>
                  </section>
                </div>
              )}

              <div className="px-7 py-5 text-center text-[16px] font-bold text-[#6b83a1]">You&apos;ve reached the end of the list</div>
            </>
          )}
        </section>
      </section>
    </main>
  );
}
