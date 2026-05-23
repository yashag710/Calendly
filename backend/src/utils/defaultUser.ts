import { prisma } from "../config/prisma.js";

export async function getDefaultUser() {
  const user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (user) return user;

  return prisma.user.create({
    data: {
      name: "Yash Agarwal",
      email: "yash@example.com",
      timezone: "Asia/Kolkata"
    }
  });
}

