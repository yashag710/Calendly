import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { getDefaultUser } from "../utils/defaultUser.js";
import { HttpError } from "../utils/http.js";

const eventTypeSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#8247f5"),
  description: z.string().optional().nullable(),
  location: z.string().min(2).default("Google Meet"),
  durationMinutes: z.coerce.number().int().min(15).max(240),
  bufferBeforeMinutes: z.coerce.number().int().min(0).max(120).default(0),
  bufferAfterMinutes: z.coerce.number().int().min(0).max(120).default(0),
  scheduleId: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  customQuestions: z.array(z.object({
    id: z.string().optional(),
    label: z.string().min(2),
    required: z.boolean().default(false)
  })).default([])
});

async function eventTypeColors(ids: string[]) {
  if (!ids.length) return new Map<string, string>();
  const rows = await prisma.$queryRaw<Array<{ id: string; color: string }>>`
    SELECT id, color FROM "EventType" WHERE id IN (${Prisma.join(ids)})
  `;
  return new Map(rows.map((row) => [row.id, row.color]));
}

async function withEventTypeColor<T extends { id: string }>(eventType: T) {
  const colors = await eventTypeColors([eventType.id]);
  return { ...eventType, color: colors.get(eventType.id) ?? "#8247f5" };
}

async function uniqueSlug(slug: string) {
  let candidate = slug;
  let suffix = 2;

  while (await prisma.eventType.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    candidate = `${slug}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

export async function listEventTypes() {
  const user = await getDefaultUser();
  const eventTypes = await prisma.eventType.findMany({
    where: { userId: user.id },
    include: { schedule: true, customQuestions: true },
    orderBy: { createdAt: "desc" }
  });
  const colors = await eventTypeColors(eventTypes.map((eventType) => eventType.id));
  return eventTypes.map((eventType) => ({ ...eventType, color: colors.get(eventType.id) ?? "#8247f5" }));
}

export async function getEventType(id: string) {
  const eventType = await prisma.eventType.findUnique({
    where: { id },
    include: { schedule: true, customQuestions: true }
  });
  if (!eventType) throw new HttpError(404, "Event type not found");
  return withEventTypeColor(eventType);
}

export async function createEventType(input: unknown) {
  const user = await getDefaultUser();
  const data = eventTypeSchema.parse(input);
  const scheduleId = data.scheduleId ?? (await prisma.availabilitySchedule.findFirst({ where: { userId: user.id, isDefault: true } }))?.id;
  const slug = await uniqueSlug(data.slug);

  const eventType = await prisma.eventType.create({
    data: {
      userId: user.id,
      scheduleId,
      name: data.name,
      slug,
      description: data.description,
      location: data.location,
      durationMinutes: data.durationMinutes,
      bufferBeforeMinutes: data.bufferBeforeMinutes,
      bufferAfterMinutes: data.bufferAfterMinutes,
      isActive: data.isActive,
      customQuestions: {
        create: data.customQuestions.map(({ label, required }) => ({ label, required }))
      }
    },
    include: { schedule: true, customQuestions: true }
  });
  await prisma.$executeRaw`UPDATE "EventType" SET color = ${data.color} WHERE id = ${eventType.id}`;
  return { ...eventType, color: data.color };
}

export async function updateEventType(id: string, input: unknown) {
  await getEventType(id);
  const data = eventTypeSchema.parse(input);

  return prisma.$transaction(async (tx) => {
    await tx.customQuestion.deleteMany({ where: { eventTypeId: id } });
    const eventType = await tx.eventType.update({
      where: { id },
      data: {
        scheduleId: data.scheduleId,
        name: data.name,
        slug: data.slug,
        description: data.description,
        location: data.location,
        durationMinutes: data.durationMinutes,
        bufferBeforeMinutes: data.bufferBeforeMinutes,
        bufferAfterMinutes: data.bufferAfterMinutes,
        isActive: data.isActive,
        customQuestions: {
          create: data.customQuestions.map(({ label, required }) => ({ label, required }))
        }
      },
      include: { schedule: true, customQuestions: true }
    });
    await tx.$executeRaw`UPDATE "EventType" SET color = ${data.color} WHERE id = ${id}`;
    return { ...eventType, color: data.color };
  });
}

export async function deleteEventType(id: string) {
  await getEventType(id);
  return prisma.$transaction(async (tx) => {
    await tx.booking.deleteMany({ where: { eventTypeId: id } });
    return tx.eventType.delete({ where: { id } });
  });
}
