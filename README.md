# Glow Dental Clinic

A clinic management and patient booking system for Glow Dental Clinic, built with:

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **Prisma 5** + **PostgreSQL**
- **Clerk** for authentication

> The active application lives in [`web/`](./web). A `legacy/` folder contains
> an earlier Flask + MySQL prototype of this system, kept for historical
> reference only — it is not part of the running application.

## Getting Started

```bash
cd web
npm install
cp .env.example .env       # then fill in your DATABASE_URL, DIRECT_URL and Clerk keys
npx prisma migrate deploy  # apply the schema to your database
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

## Roles

- **Patient** — books/cancels appointments, views appointment & treatment history, manages their own profile (address, phone, chronic conditions).
- **Dentist** — views today's/upcoming/past appointments, records treatments (from a standardized service price list) for today's visits, manages holiday/unavailable dates, views statistics.
- **Receptionist** — searches/registers patients (including walk-ins and phone bookings), books appointments on behalf of any patient, checks patients in, views the clinic-wide schedule for today, and manages billing/payment status.
- **Admin** — manages staff accounts, clinic business hours, the service price list, and clinic-wide billing/revenue reporting.

Bookings are validated against the clinic's configured business hours, working days, and each dentist's holidays (**Dashboard → Settings**, admin only).

### How staff accounts are created

There's no self sign-up for staff. An **Admin** pre-registers a staff member's
name, email, and role from **Dashboard → Staff**. When that person then signs
up (or logs in, if they already have an account) through Clerk using the
**same email address**, their account is automatically linked to that role —
no manual database work required.

## Integrations

- **Resend** — booking confirmations, appointment reminders, and payment receipts. Set `RESEND_API_KEY` and `EMAIL_FROM`. If unset, emails are skipped with a console warning (the app still works without it).
- **Paystack** — patients can pay their treatment balance online from **My Appointments**. Set `PAYSTACK_SECRET_KEY`, and register `/api/webhooks/paystack` as a webhook endpoint in the Paystack dashboard for reliable payment confirmation.
- **Reminder emails** — `GET /api/cron/reminders` emails patients with an appointment tomorrow. Scheduled automatically once a day via `vercel.json` if deployed on Vercel (set `CRON_SECRET` in your Vercel project settings to secure it).

## Project Structure

```
web/
  prisma/schema.prisma        Database schema
  src/app/                    Routes (App Router)
  src/app/actions/            Server actions (mutations)
  src/components/             Dashboards, layout/navigation
  src/lib/                    Shared Prisma client, auth helpers, constants
```
