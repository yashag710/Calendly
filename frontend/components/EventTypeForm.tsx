"use client";

import { useState } from "react";
import type { EventType, Schedule } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type QuestionDraft = { label: string; required: boolean };

const emptyForm = {
  name: "",
  slug: "",
  color: "#8247f5",
  description: "",
  location: "Google Meet",
  durationMinutes: 30,
  bufferBeforeMinutes: 0,
  bufferAfterMinutes: 0,
  scheduleId: "",
  isActive: true,
  customQuestions: [] as QuestionDraft[]
};

export function EventTypeForm({
  schedules,
  initial,
  onSubmit,
  submitLabel
}: {
  schedules: Schedule[];
  initial?: EventType;
  onSubmit: (value: typeof emptyForm) => Promise<void>;
  submitLabel: string;
}) {
  const [form, setForm] = useState({
    ...emptyForm,
    ...initial,
    description: initial?.description ?? "",
    scheduleId: initial?.scheduleId ?? schedules[0]?.id ?? "",
    customQuestions: initial?.customQuestions?.map(({ label, required }) => ({ label, required })) ?? []
  });
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    await onSubmit(form);
    setSaving(false);
  }

  return (
    <form className="grid gap-5" onSubmit={submit}>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="grid gap-2">
          <Label>Name</Label>
          <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
        </div>
        <div className="grid gap-2">
          <Label>URL slug</Label>
          <Input value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value.toLowerCase().replaceAll(" ", "-") })} required />
        </div>
      </div>
      <div className="grid gap-2">
        <Label>Description</Label>
        <Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="grid gap-2">
          <Label>Duration</Label>
          <Select value={form.durationMinutes} onChange={(event) => setForm({ ...form, durationMinutes: Number(event.target.value) })}>
            {[15, 30, 45, 60, 90, 120].map((duration) => <option key={duration} value={duration}>{duration} minutes</option>)}
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Schedule</Label>
          <Select value={form.scheduleId} onChange={(event) => setForm({ ...form, scheduleId: event.target.value })}>
            {schedules.map((schedule) => <option key={schedule.id} value={schedule.id}>{schedule.name}</option>)}
          </Select>
        </div>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="grid gap-2">
          <Label>Buffer before</Label>
          <Input type="number" min="0" value={form.bufferBeforeMinutes} onChange={(event) => setForm({ ...form, bufferBeforeMinutes: Number(event.target.value) })} />
        </div>
        <div className="grid gap-2">
          <Label>Buffer after</Label>
          <Input type="number" min="0" value={form.bufferAfterMinutes} onChange={(event) => setForm({ ...form, bufferAfterMinutes: Number(event.target.value) })} />
        </div>
      </div>
      <div className="grid gap-2">
        <Label>Location</Label>
        <Input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} />
      </div>
      <Card className="shadow-none">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">Invitee questions</CardTitle>
          <Button type="button" variant="secondary" onClick={() => setForm({ ...form, customQuestions: [...form.customQuestions, { label: "", required: false }] })}>Add</Button>
        </CardHeader>
        <CardContent className="grid gap-4">
          {form.customQuestions.map((question, index) => (
            <div className="grid gap-4 md:grid-cols-[1fr_180px]" key={index}>
              <div className="grid gap-2">
                <Label>Question</Label>
                <Input value={question.label} onChange={(event) => {
                  const next = [...form.customQuestions];
                  next[index] = { ...question, label: event.target.value };
                  setForm({ ...form, customQuestions: next });
                }} />
              </div>
              <div className="grid gap-2">
                <Label>Required</Label>
                <Select value={String(question.required)} onChange={(event) => {
                  const next = [...form.customQuestions];
                  next[index] = { ...question, required: event.target.value === "true" };
                  setForm({ ...form, customQuestions: next });
                }}>
                  <option value="false">Optional</option>
                  <option value="true">Required</option>
                </Select>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      <Button className="w-fit" disabled={saving}>{saving ? "Saving..." : submitLabel}</Button>
    </form>
  );
}
