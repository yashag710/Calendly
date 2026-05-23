import { PrismaClient } from "@prisma/client";
import { DateTime } from "luxon";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "yash@example.com" },
    update: {},
    create: {
      name: "Yash Agarwal",
      email: "yash@example.com",
      timezone: "Asia/Kolkata"
    }
  });

  await prisma.bookingAnswer.deleteMany();
  await prisma.booking.deleteMany({ where: { userId: user.id } });
  await prisma.customQuestion.deleteMany();
  await prisma.eventType.deleteMany({ where: { userId: user.id } });
  await prisma.availabilitySchedule.deleteMany({ where: { userId: user.id } });

  const schedule = await prisma.availabilitySchedule.create({
    data: {
      userId: user.id,
      name: "Working hours",
      timezone: "Asia/Kolkata",
      isDefault: true,
      rules: {
        create: [1, 2, 3, 4, 5].map((dayOfWeek) => ({
          dayOfWeek,
          startTime: "09:00",
          endTime: "17:00"
        }))
      },
      overrides: {
        create: [
          {
            date: DateTime.now().plus({ days: 7 }).setZone("UTC").set({ hour: 12, minute: 0, second: 0, millisecond: 0 }).toJSDate(),
            isAvailable: true,
            startTime: "11:00",
            endTime: "15:00"
          }
        ]
      }
    }
  });

  const intro = await prisma.eventType.create({
    data: {
      userId: user.id,
      scheduleId: schedule.id,
      name: "30 Minute Meeting",
      slug: "30min",
      description: "A focused introduction call to align on goals and next steps.",
      durationMinutes: 30,
      bufferBeforeMinutes: 5,
      bufferAfterMinutes: 10,
      customQuestions: {
        create: [
          { label: "What would you like to discuss?", required: true },
          { label: "Share any context that would help me prepare", required: false }
        ]
      }
    }
  });

  await prisma.eventType.create({
    data: {
      userId: user.id,
      scheduleId: schedule.id,
      name: "Product Strategy Session",
      slug: "strategy",
      description: "A deeper conversation for product, engineering, or launch planning.",
      durationMinutes: 60,
      bufferBeforeMinutes: 10,
      bufferAfterMinutes: 15
    }
  });

  const start = DateTime.now().setZone("Asia/Kolkata").plus({ days: 2 }).set({ hour: 10, minute: 0, second: 0, millisecond: 0 });
  await prisma.booking.create({
    data: {
      userId: user.id,
      eventTypeId: intro.id,
      inviteeName: "Aarav Sharma",
      inviteeEmail: "aarav@example.com",
      startTime: start.toUTC().toJSDate(),
      endTime: start.plus({ minutes: 30 }).toUTC().toJSDate(),
      timezone: "Asia/Kolkata",
      answers: {
        create: [
          {
            questionId: (await prisma.customQuestion.findFirstOrThrow({ where: { eventTypeId: intro.id, required: true } })).id,
            answer: "I want to discuss a full-stack internship assignment."
          }
        ]
      }
    }
  });

  const past = DateTime.now().setZone("Asia/Kolkata").minus({ days: 3 }).set({ hour: 14, minute: 0, second: 0, millisecond: 0 });
  await prisma.booking.create({
    data: {
      userId: user.id,
      eventTypeId: intro.id,
      inviteeName: "Maya Patel",
      inviteeEmail: "maya@example.com",
      startTime: past.toUTC().toJSDate(),
      endTime: past.plus({ minutes: 30 }).toUTC().toJSDate(),
      timezone: "Asia/Kolkata"
    }
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
