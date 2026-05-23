import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { availabilityRouter } from "./routes/availabilityRoutes.js";
import { bookingRouter } from "./routes/bookingRoutes.js";
import { eventTypesRouter } from "./routes/eventTypesRoutes.js";
import { errorHandler } from "./utils/http.js";

export const app = express();

app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || env.corsOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error("Not allowed by CORS"));
  }
}));
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/event-types", eventTypesRouter);
app.use("/api/availability", availabilityRouter);
app.use("/api", bookingRouter);

app.use(errorHandler);
