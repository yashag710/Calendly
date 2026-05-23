"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle2, RotateCcw } from "lucide-react";
import { CalendlyLogo } from "@/components/CalendlyLogo";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/date";
import type { Booking } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ConfirmationPage() {
  const params = useParams<{ id: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);

  useEffect(() => {
    api<Booking>(`/bookings/${params.id}`).then(setBooking);
  }, [params.id]);

  return (
    <main className="min-h-screen bg-calendly-wash px-5 py-12">
      <section className="mx-auto max-w-2xl rounded-2xl border border-calendly-line bg-white p-8 shadow-calendly">
        <CalendlyLogo />
        <div className="mt-10">
          <div className="mb-5 grid size-14 place-items-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="size-7" />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-calendly-blue">Confirmed</p>
          <h1 className="mt-2 text-4xl font-bold text-calendly-navy">You are scheduled</h1>
          <p className="mt-3 text-sm leading-6 text-calendly-muted">A calendar invitation can be sent from the notification provider configured for production.</p>
        </div>
        {booking && (
          <div className="mt-8 grid gap-4">
            <Card>
              <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <strong className="text-lg text-calendly-navy">{booking.eventType.name}</strong>
                <p className="mt-1 text-sm font-semibold text-calendly-muted">{formatDateTime(booking.startTime, booking.timezone)}</p>
                <p className="mt-1 text-sm text-calendly-muted">{booking.inviteeName} · {booking.inviteeEmail}</p>
              </div>
              <Button asChild variant="secondary">
                <Link href={`/book/${booking.eventType.slug}?reschedule=${booking.rescheduleToken}`}><RotateCcw className="size-4" />Reschedule</Link>
              </Button>
              </CardContent>
            </Card>
          </div>
        )}
        <div className="mt-8">
          <Button asChild>
            <Link href="/">Back to dashboard</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
