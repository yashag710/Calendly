import { Router } from "express";
import { createEventType, deleteEventType, getEventType, listEventTypes, updateEventType } from "../controllers/eventTypesController.js";
import { asyncHandler } from "../utils/http.js";

export const eventTypesRouter = Router();

eventTypesRouter.get("/", asyncHandler(async (_req, res) => {
  res.json(await listEventTypes());
}));

eventTypesRouter.get("/:id", asyncHandler(async (req, res) => {
  res.json(await getEventType(String(req.params.id)));
}));

eventTypesRouter.post("/", asyncHandler(async (req, res) => {
  res.status(201).json(await createEventType(req.body));
}));

eventTypesRouter.put("/:id", asyncHandler(async (req, res) => {
  res.json(await updateEventType(String(req.params.id), req.body));
}));

eventTypesRouter.delete("/:id", asyncHandler(async (req, res) => {
  res.json(await deleteEventType(String(req.params.id)));
}));
