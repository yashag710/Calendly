import { Router } from "express";
import {
  cancelBooking,
  createBooking,
  getBooking,
  getPublicEvent,
  getRescheduleContext,
  getSlots,
  listMeetings,
  rescheduleBooking
} from "../controllers/bookingController.js";
import { asyncHandler } from "../utils/http.js";

export const bookingRouter = Router();

bookingRouter.get("/meetings", asyncHandler(async (req, res) => {
  res.json(await listMeetings(req.query));
}));

bookingRouter.patch("/meetings/:id/cancel", asyncHandler(async (req, res) => {
  res.json(await cancelBooking(String(req.params.id), req.body?.reason));
}));

bookingRouter.get("/bookings/:id", asyncHandler(async (req, res) => {
  res.json(await getBooking(String(req.params.id)));
}));

bookingRouter.get("/reschedule/:token", asyncHandler(async (req, res) => {
  res.json(await getRescheduleContext(String(req.params.token)));
}));

bookingRouter.post("/reschedule/:token", asyncHandler(async (req, res) => {
  res.status(201).json(await rescheduleBooking(String(req.params.token), req.body));
}));

bookingRouter.get("/public/:slug", asyncHandler(async (req, res) => {
  res.json(await getPublicEvent(String(req.params.slug)));
}));

bookingRouter.get("/public/:slug/slots", asyncHandler(async (req, res) => {
  res.json(await getSlots(String(req.params.slug), String(req.query.date ?? "")));
}));

bookingRouter.post("/public/:slug/bookings", asyncHandler(async (req, res) => {
  res.status(201).json(await createBooking(String(req.params.slug), req.body));
}));
