import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { getDefaultUser } from "../utils/defaultUser.js";
import { HttpError } from "../utils/http.js";

const scheduleSchema = z.object({
  name: z.string().min(2),
  timezone: z.string().min(2),
  isDefault: z.boolean().default(false),
  rules: z.array(z.object({
    dayOfWeek: z.number().int().min(1).max(7),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/)
  })),
  overrides: z.array(z.object({
    date: z.string(),
    isAvailable: z.boolean(),
    startTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
    endTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable()
  })).default([])
});

export async function listSchedules() {
  const user = await getDefaultUser();
  return prisma.availabilitySchedule.findMany({
    where: { userId: user.id },
    include: { rules: { orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] }, overrides: { orderBy: { date: "asc" } } },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }]
  });
}

export async function getSchedule(id: string) {
  const schedule = await prisma.availabilitySchedule.findUnique({
    where: { id },
    include: { rules: true, overrides: true }
  });
  if (!schedule) throw new HttpError(404, "Schedule not found");
  return schedule;
}

export async function createSchedule(input: unknown) {
  const user = await getDefaultUser();
  const data = scheduleSchema.parse(input);

  return prisma.$transaction(async (tx) => {
    if (data.isDefault) {
      await tx.availabilitySchedule.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
    }

    return tx.availabilitySchedule.create({
      data: {
        userId: user.id,
        name: data.name,
        timezone: data.timezone,
        isDefault: data.isDefault,
        rules: { create: data.rules },
        overrides: { create: data.overrides.map((item) => ({ ...item, date: new Date(`${item.date}T12:00:00.000Z`) })) }
      },
      include: { rules: true, overrides: true }
    });
  });
}

export async function updateSchedule(id: string, input: unknown) {
  const existing = await getSchedule(id);
  const data = scheduleSchema.parse(input);

  return prisma.$transaction(async (tx) => {
    if (data.isDefault) {
      await tx.availabilitySchedule.updateMany({ where: { userId: existing.userId }, data: { isDefault: false } });
    }

    await tx.availabilityRule.deleteMany({ where: { scheduleId: id } });
    await tx.dateOverride.deleteMany({ where: { scheduleId: id } });

    return tx.availabilitySchedule.update({
      where: { id },
      data: {
        name: data.name,
        timezone: data.timezone,
        isDefault: data.isDefault,
        rules: { create: data.rules },
        overrides: { create: data.overrides.map((item) => ({ ...item, date: new Date(`${item.date}T12:00:00.000Z`) })) }
      },
      include: { rules: true, overrides: true }
    });
  });
}

export async function deleteSchedule(id: string) {
  await getSchedule(id);
  return prisma.availabilitySchedule.delete({ where: { id } });
}
