# Scheduling Platform (Calendly Clone)

An industry-style full-stack scheduling app built with Next.js, Express, PostgreSQL, Prisma, and TypeScript.

## Features

- Event type CRUD with unique public booking links
- Availability schedules with weekdays, time ranges, timezone, and active schedule selection
- Date-specific overrides
- Public booking page with month calendar, slot picker, invitee form, and custom questions
- Double-booking prevention in the backend
- Booking confirmation page
- Meetings page with upcoming/past views, cancellation, and reschedule links
- Buffer time before and after meetings
- Responsive Calendly-inspired UI
- Seed data for a default user, schedules, event types, custom questions, and sample meetings

## Tech Stack

- Frontend: Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui-style components
- Backend: Node.js, Express, TypeScript
- Database: PostgreSQL
- ORM: Prisma

## Project Structure

```text
backend/
  prisma/
    schema.prisma
    seed.ts
  src/
    controllers/
    routes/
    services/
    utils/
frontend/
  app/
  components/
    ui/
  lib/
  types/
```

## Setup

1. Start PostgreSQL:

```bash
docker compose up -d
```

2. Configure backend:

```bash
cd backend
cp .env.example .env
npm install
npm run prisma:migrate
npm run seed
npm run dev
```

3. Configure frontend in another terminal:

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`. Backend runs on `http://localhost:4000`. The Docker database maps Postgres to local port `5433` to avoid conflicts with existing local Postgres installs.

## Important URLs

- Admin event types: `http://localhost:3000`
- Availability: `http://localhost:3000/availability`
- Meetings: `http://localhost:3000/meetings`
- Sample booking page: `http://localhost:3000/book/30min`

## Database Design

The schema models a default user with event types, availability schedules, weekly rules, date overrides, bookings, custom invitee questions, and booking answers. Bookings store exact UTC start/end times plus the booking timezone for consistent comparisons and display. A composite unique constraint on active bookings prevents duplicate reservations for the same event type and start time.

## Assumptions

- No login is required, so the backend uses a seeded default user.
- Email notifications are represented by notification-ready booking state and API responses. A real provider such as Resend, SendGrid, or SES can be plugged into the booking and cancellation services.
- Times are computed with the schedule timezone and persisted as UTC timestamps.
