import { Router } from "express";
import { createSchedule, deleteSchedule, listSchedules, updateSchedule } from "../controllers/availabilityController.js";
import { asyncHandler } from "../utils/http.js";

export const availabilityRouter = Router();

availabilityRouter.get("/", asyncHandler(async (_req, res) => {
  res.json(await listSchedules());
}));

availabilityRouter.post("/", asyncHandler(async (req, res) => {
  res.status(201).json(await createSchedule(req.body));
}));

availabilityRouter.put("/:id", asyncHandler(async (req, res) => {
  res.json(await updateSchedule(String(req.params.id), req.body));
}));

availabilityRouter.delete("/:id", asyncHandler(async (req, res) => {
  res.json(await deleteSchedule(String(req.params.id)));
}));
