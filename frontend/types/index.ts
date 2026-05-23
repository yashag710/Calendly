export type CustomQuestion = {
  id: string;
  label: string;
  required: boolean;
};

export type AvailabilityRule = {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

export type DateOverride = {
  id?: string;
  date: string;
  isAvailable: boolean;
  startTime?: string | null;
  endTime?: string | null;
};

export type Schedule = {
  id: string;
  name: string;
  timezone: string;
  isDefault: boolean;
  rules: AvailabilityRule[];
  overrides: DateOverride[];
};

export type EventType = {
  id: string;
  name: string;
  slug: string;
  color?: string;
  description?: string | null;
  location: string;
  durationMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  isActive: boolean;
  scheduleId?: string | null;
  schedule?: Schedule | null;
  customQuestions: CustomQuestion[];
  user?: {
    id: string;
    name: string;
    email: string;
    timezone: string;
  };
};

export type Slot = {
  startTime: string;
  endTime: string;
  label: string;
};

export type Booking = {
  id: string;
  inviteeName: string;
  inviteeEmail: string;
  startTime: string;
  endTime: string;
  timezone: string;
  status: "CONFIRMED" | "CANCELLED";
  cancellationReason?: string | null;
  rescheduleToken: string;
  createdAt?: string;
  eventType: EventType;
  user?: {
    id: string;
    name: string;
    email: string;
    timezone: string;
  };
  answers?: Array<{
    id: string;
    answer: string;
    questionId: string;
    question?: CustomQuestion;
  }>;
};
