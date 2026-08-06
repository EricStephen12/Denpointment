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

The **website** is hosted on **Vercel**. **Railway** is used only for **n8n** (automations), not for this Next.js app.

Step-by-step automation guide + importable workflows: [`n8n/README.md`](./n8n/README.md).

### n8n on Railway (automations only)

1. Railway → **New Project** → deploy the **n8n** template.
2. Add a public domain; set `WEBHOOK_URL` to that URL (trailing `/`).
3. Import workflows from [`n8n/`](./n8n/) or build them using the guide.
4. On Vercel, set `N8N_WEBHOOK_BOOKING`, `N8N_WEBHOOK_PAYMENT`, `N8N_WEBHOOK_CONTACT` to each workflow’s Production webhook URL, then redeploy.

## Roles

- **Patient** — books/cancels appointments, views appointment & treatment history, manages their own profile (address, phone, chronic conditions).
- **Dentist** — views today's/upcoming/past appointments, records treatments (from a standardized service price list) for today's visits, manages holiday/unavailable dates, views statistics.
- **Receptionist** — searches/registers patients (including walk-ins and phone bookings), books appointments on behalf of any patient, checks patients in, views the clinic-wide schedule for today, and manages billing/payment status.
- **Admin** — manages staff accounts, clinic business hours, the service price list, and clinic-wide billing/revenue reporting.

Bookings are validated against the clinic's configured business hours, working days, and each dentist's holidays (**Dashboard → Settings**, admin only).

Admins can also edit the public website write-ups, accent color, and featured package prices from **Dashboard → Website** — no code changes required.

### How staff accounts are created

There's no self sign-up for staff. An **Admin** pre-registers a staff member's
name, email, and role from **Dashboard → Staff**. When that person then signs
up (or logs in, if they already have an account) through Clerk using the
**same email address**, their account is automatically linked to that role —
no manual database work required.

To create the **first** admin (chicken-and-egg), seed from the `web/` folder:

```bash
SEED_ADMIN_EMAIL=you@example.com npm run db:seed
```

Then sign in with Clerk using that same email.

## Integrations

- **Resend** — booking confirmations, appointment reminders, and payment receipts. Set `RESEND_API_KEY` and `EMAIL_FROM`. If unset, emails are skipped with a console warning (the app still works without it).
- **Paystack** — patients can pay their treatment balance online from **My Appointments**. Set `PAYSTACK_SECRET_KEY`, and register `/api/webhooks/paystack` as a webhook endpoint in the Paystack dashboard for reliable payment confirmation.
- **Reminder emails** — `GET /api/cron/reminders` emails patients with an appointment tomorrow. Scheduled via `vercel.json` on Vercel (set `CRON_SECRET` in Vercel project settings). You can also trigger the same URL from n8n on Railway.

## Project Structure

```
web/
  prisma/schema.prisma        Database schema
  src/app/                    Routes (App Router)
  src/app/actions/            Server actions (mutations)
  src/components/             Dashboards, layout/navigation
  src/lib/                    Shared Prisma client, auth helpers, constants
```
