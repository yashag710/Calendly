"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import type { EventType } from "@/types";

function CornerRibbon() {
  return (
    <div className="absolute right-0 top-0 z-10 h-[104px] w-[104px] overflow-hidden rounded-tr-lg">
      <div className="absolute right-[-41px] top-[25px] flex h-[34px] w-[150px] rotate-45 items-center justify-center bg-[#4b555f] text-center text-[10px] font-bold uppercase leading-[11px] text-white shadow-md">
        <span>Powered by<br />Calendly</span>
      </div>
    </div>
  );
}

export default function PublicLandingPage() {
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);

  useEffect(() => {
    api<EventType[]>("/event-types").then((events) => setEventTypes(events.filter((eventType) => eventType.isActive))).catch(() => setEventTypes([]));
  }, []);

  return (
    <main className="min-h-screen bg-[#fbfbfc] px-4 py-10 lg:py-12">
      <section className="relative mx-auto min-h-[820px] max-w-[1280px] overflow-hidden rounded-lg border border-[#d7e2ee] bg-white shadow-[0_2px_10px_rgba(11,53,88,0.12)]">
        <CornerRibbon />

        <div className="mx-auto max-w-[920px] px-8 pt-14 text-center">
          <h1 className="text-[20px] font-bold text-[#31516f]">Yash Agarwal</h1>
          <p className="mx-auto mt-8 max-w-[360px] text-[17px] font-semibold leading-7 text-[#6b83a1]">
            Welcome to my scheduling page. Please follow the instructions to add an event to my calendar.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-[920px] gap-x-12 gap-y-8 px-8 md:grid-cols-2">
          {eventTypes.map((eventType) => (
            <Link
              key={eventType.id}
              href={`/book/${eventType.slug}`}
              className="group flex items-center justify-between border-t border-[#d7e2ee] px-7 py-8 text-left transition hover:bg-[#f6fbff]"
            >
              <span className="flex min-w-0 items-center gap-7">
                <span className="size-8 shrink-0 rounded-full" style={{ backgroundColor: eventType.color ?? "#8247f5" }} />
                <span className="truncate text-[20px] font-bold text-[#0b3558] group-hover:text-[#006bff]">{eventType.name}</span>
              </span>
              <ChevronRight className="size-7 shrink-0 fill-[#0b3558] text-[#0b3558] transition group-hover:translate-x-1 group-hover:text-[#006bff]" />
            </Link>
          ))}
          {!eventTypes.length && (
            <p className="border-t border-[#d7e2ee] px-7 py-8 text-left text-[16px] font-semibold text-[#6b83a1]">
              No event types are available.
            </p>
          )}
        </div>

        <div className="absolute bottom-8 left-10">
          <button className="border-b-2 border-transparent text-[16px] font-bold text-[#006bff] transition hover:border-[#006bff]">
            Cookie settings
          </button>
        </div>
      </section>
    </main>
  );
}
