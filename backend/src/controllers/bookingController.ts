import { BookingStatus, Prisma } from "@prisma/client";
import { DateTime } from "luxon";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { getAvailableSlots } from "../services/slotService.js";
import { HttpError } from "../utils/http.js";

const bookingSchema = z.object({
  inviteeName: z.string().min(2),
  inviteeEmail: z.string().email(),
  startTime: z.string().datetime(),
  timezone: z.string().min(2),
  rescheduleToken: z.string().optional(),
  answers: z.array(z.object({
    questionId: z.string(),
    answer: z.string()
  })).default([])
});

const meetingQuerySchema = z.object({
  period: z.enum(["upcoming", "past", "range"]).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  eventTypeId: z.string().optional(),
  inviteeEmail: z.string().optional(),
  status: z.enum(["CONFIRMED", "CANCELLED"]).optional()
});

const rescheduleSchema = z.object({
  startTime: z.string().datetime(),
  timezone: z.string().min(2).optional(),
  answers: z.array(z.object({
    questionId: z.string(),
    answer: z.string()
  })).optional()
});

export async function getPublicEvent(slug: string) {
  const eventType = await prisma.eventType.findUnique({
    where: { slug },
    include: {
      user: true,
      schedule: { include: { rules: true, overrides: true } },
      customQuestions: true
    }
  });

  if (!eventType || !eventType.isActive) throw new HttpError(404, "Event type not found");
  return eventType;
}

export async function getSlots(slug: string, date: string) {
  const eventType = await getPublicEvent(slug);
  return getAvailableSlots(eventType, date);
}

export async function createBooking(slug: string, input: unknown) {
  const eventType = await getPublicEvent(slug);
  const data = bookingSchema.parse(input);
  const start = DateTime.fromISO(data.startTime, { zone: "utc" });
  const end = start.plus({ minutes: eventType.durationMinutes });

  const dateForSlots = start.setZone(eventType.schedule?.timezone ?? data.timezone).toISODate();
  if (!dateForSlots) throw new HttpError(400, "Invalid start time");

  const availableSlots = await getAvailableSlots(eventType, dateForSlots);
  const isAvailable = availableSlots.some((slot) => slot.startTime === start.toISO());
  if (!isAvailable) throw new HttpError(409, "That time is no longer available");

  const requiredQuestions = eventType.customQuestions.filter((question) => question.required);
  for (const question of requiredQuestions) {
    const answer = data.answers.find((item) => item.questionId === question.id)?.answer.trim();
    if (!answer) throw new HttpError(400, `Missing answer for: ${question.label}`);
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.create({
        data: {
          userId: eventType.userId,
          eventTypeId: eventType.id,
          inviteeName: data.inviteeName,
          inviteeEmail: data.inviteeEmail,
          startTime: start.toJSDate(),
          endTime: end.toJSDate(),
          timezone: data.timezone,
          answers: {
            create: data.answers
              .filter((item) => item.answer.trim())
              .map((item) => ({ questionId: item.questionId, answer: item.answer.trim() }))
          }
        },
        include: { eventType: true, answers: { include: { question: true } } }
      });

      if (data.rescheduleToken) {
        await tx.booking.updateMany({
          where: {
            rescheduleToken: data.rescheduleToken,
            id: { not: booking.id },
            status: BookingStatus.CONFIRMED
          },
          data: {
            status: BookingStatus.CANCELLED,
            cancellationReason: "Rescheduled by invitee"
          }
        });
      }

      return booking;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new HttpError(409, "That time is already booked");
    }
    throw error;
  }
}

export async function rescheduleBooking(token: string, input: unknown) {
  const data = rescheduleSchema.parse(input);
  const previous = await prisma.booking.findUnique({
    where: { rescheduleToken: token },
    include: { eventType: true, answers: true }
  });
  if (!previous) throw new HttpError(404, "Booking not found");
  if (previous.status !== BookingStatus.CONFIRMED) throw new HttpError(409, "This meeting has already been cancelled");

  return createBooking(previous.eventType.slug, {
    inviteeName: previous.inviteeName,
    inviteeEmail: previous.inviteeEmail,
    timezone: previous.timezone,
    answers: previous.answers.map((answer) => ({ questionId: answer.questionId, answer: answer.answer })),
    rescheduleToken: token,
    ...data
  });
}

export async function getRescheduleContext(token: string) {
  const booking = await prisma.booking.findUnique({
    where: { rescheduleToken: token },
    include: { eventType: true }
  });
  if (!booking) throw new HttpError(404, "Booking not found");
  return booking;
}

export async function getBooking(id: string) {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { eventType: true, user: true, answers: { include: { question: true } } }
  });
  if (!booking) throw new HttpError(404, "Booking not found");
  return {
    ...booking,
    publicUrl: `${env.appUrl}/confirmation/${booking.id}`
  };
}

export async function listMeetings(query: unknown) {
  const data = meetingQuerySchema.parse(query);
  const now = new Date();
  const where: Prisma.BookingWhereInput = {
    status: data.status ?? BookingStatus.CONFIRMED,
    ...(data.eventTypeId ? { eventTypeId: data.eventTypeId } : {}),
    ...(data.inviteeEmail ? { inviteeEmail: { contains: data.inviteeEmail, mode: "insensitive" } } : {})
  };

  if (data.period === "past") {
    where.endTime = { lt: now };
  } else if (data.period === "range") {
    where.startTime = {
      ...(data.from ? { gte: new Date(data.from) } : {}),
      ...(data.to ? { lte: new Date(data.to) } : {})
    };
  } else {
    where.startTime = { gte: now };
  }

  return prisma.booking.findMany({
    where,
    include: {
      eventType: true,
      user: true,
      answers: { include: { question: true } }
    },
    orderBy: { startTime: data.period === "past" ? "desc" : "asc" }
  });
}

export async function cancelBooking(id: string, reason?: string) {
  await getBooking(id);
  return prisma.booking.update({
    where: { id },
    data: {
      status: BookingStatus.CANCELLED,
      cancellationReason: reason ?? "Cancelled by organizer"
    },
    include: {
      eventType: true,
      user: true,
      answers: { include: { question: true } }
    }
  });
}
