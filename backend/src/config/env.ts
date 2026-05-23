import "dotenv/config";

export const env = {
  port: Number(process.env.PORT ?? 4000),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  appUrl: process.env.APP_URL ?? "http://localhost:3000"
};

