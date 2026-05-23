"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { EventTypeForm } from "@/components/EventTypeForm";
import { api } from "@/lib/api";
import type { EventType, Schedule } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function EditEventTypePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [eventType, setEventType] = useState<EventType | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  useEffect(() => {
    Promise.all([
      api<EventType>(`/event-types/${params.id}`),
      api<Schedule[]>("/availability")
    ]).then(([eventData, scheduleData]) => {
      setEventType(eventData);
      setSchedules(scheduleData);
    });
  }, [params.id]);

  return (
    <main>
      <header className="hidden h-[86px] items-center justify-end bg-white px-8 lg:flex">
        <button className="grid size-10 place-items-center rounded-full bg-[#eef3fb] text-sm font-bold text-[#0b3558]">Y</button>
      </header>
      <section className="mx-auto max-w-[960px] px-4 pb-16 pt-6 sm:px-6 lg:pt-8">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#006bff]">Scheduling</p>
          <h1 className="mt-2 text-[26px] font-bold tracking-normal text-[#0b3558]">Edit event type</h1>
        </div>
      <Card>
        <CardHeader>
          <CardTitle>Event details</CardTitle>
          <CardDescription>Update this booking page, availability schedule, buffers, and invitee questions.</CardDescription>
        </CardHeader>
        <CardContent>
        {eventType && (
          <EventTypeForm
            initial={eventType}
            schedules={schedules}
            submitLabel="Save changes"
            onSubmit={async (value) => {
              await api(`/event-types/${eventType.id}`, { method: "PUT", body: JSON.stringify(value) });
              router.push("/");
            }}
          />
        )}
        </CardContent>
      </Card>
      </section>
    </main>
  );
}
