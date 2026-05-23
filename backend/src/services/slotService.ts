import type { AvailabilityRule, DateOverride, EventType } from "@prisma/client";
import { BookingStatus } from "@prisma/client";
import { DateTime, Interval } from "luxon";
import { prisma } from "../config/prisma.js";

type EventWithSchedule = EventType & {
  schedule: {
    id: string;
    timezone: string;
    rules: AvailabilityRule[];
    overrides: DateOverride[];
  } | null;
};

function parseTime(date: DateTime, time: string) {
  const [hour, minute] = time.split(":").map(Number);
  return date.set({ hour, minute, second: 0, millisecond: 0 });
}

function overlaps(aStart: DateTime, aEnd: DateTime, bStart: DateTime, bEnd: DateTime) {
  return Interval.fromDateTimes(aStart, aEnd).overlaps(Interval.fromDateTimes(bStart, bEnd));
}

export async function getAvailableSlots(eventType: EventWithSchedule, date: string) {
  if (!eventType.schedule) return [];

  const zone = eventType.schedule.timezone;
  const day = DateTime.fromISO(date, { zone }).startOf("day");
  if (!day.isValid) return [];

  const override = eventType.schedule.overrides.find((item) => DateTime.fromJSDate(item.date, { zone }).hasSame(day, "day"));
  if (override && !override.isAvailable) return [];

  const windows = override?.startTime && override?.endTime
    ? [{ startTime: override.startTime, endTime: override.endTime }]
    : eventType.schedule.rules.filter((rule) => rule.dayOfWeek === day.weekday);

  if (!windows.length) return [];

  const windowStart = day.toUTC().toJSDate();
  const windowEnd = day.plus({ days: 1 }).toUTC().toJSDate();
  const bookings = await prisma.booking.findMany({
    where: {
      userId: eventType.userId,
      status: BookingStatus.CONFIRMED,
      startTime: { lt: windowEnd },
      endTime: { gt: windowStart }
    },
    include: { eventType: true }
  });

  const now = DateTime.now().setZone(zone);
  const slots: Array<{ startTime: string; endTime: string; label: string }> = [];

  for (const window of windows) {
    const startsAt = parseTime(day, window.startTime);
    const endsAt = parseTime(day, window.endTime);
    let cursor = startsAt;

    while (cursor.plus({ minutes: eventType.durationMinutes }).toMillis() <= endsAt.toMillis()) {
      const slotStart = cursor;
      const slotEnd = cursor.plus({ minutes: eventType.durationMinutes });
      const blockedStart = slotStart.minus({ minutes: eventType.bufferBeforeMinutes });
      const blockedEnd = slotEnd.plus({ minutes: eventType.bufferAfterMinutes });

      const hasConflict = bookings.some((booking) => {
        const bookingStart = DateTime.fromJSDate(booking.startTime, { zone: "utc" }).setZone(zone);
        const bookingEnd = DateTime.fromJSDate(booking.endTime, { zone: "utc" }).setZone(zone);
        const existingBlockedStart = bookingStart.minus({ minutes: booking.eventType.bufferBeforeMinutes });
        const existingBlockedEnd = bookingEnd.plus({ minutes: booking.eventType.bufferAfterMinutes });
        return overlaps(blockedStart, blockedEnd, existingBlockedStart, existingBlockedEnd);
      });

      if (!hasConflict && slotStart.toMillis() > now.plus({ minutes: 15 }).toMillis()) {
        slots.push({
          startTime: slotStart.toUTC().toISO()!,
          endTime: slotEnd.toUTC().toISO()!,
          label: slotStart.toFormat("h:mm a")
        });
      }

      cursor = cursor.plus({ minutes: eventType.durationMinutes });
    }
  }

  return slots;
}
