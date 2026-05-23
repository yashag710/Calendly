import "dotenv/config";

const corsOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const env = {
  port: Number(process.env.PORT ?? 4000),
  corsOrigins,
  appUrl: process.env.APP_URL ?? "http://localhost:3000"
};
