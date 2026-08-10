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

- **Patient** — books/cancels appointments, views appointment & treatment history, pays treatment balance online (Paystack), manages their own profile (address, phone, chronic conditions).
- **Dentist** — today's/upcoming/past visits, visit status (checked in → in chair → completed / no-show), multi-procedure charting (tooth/FDI, surfaces, notes, Rx), edit/delete unpaid procedures, patient odontogram (adult + kids), photos/X-rays, full clinical care panel (allergies, history, plans, perio, consents, recalls, insurance, lab cases), holidays, statistics.
- **Receptionist** — searches/registers patients (walk-ins and phone bookings), books for any patient, check-in, clinic-wide today schedule, billing/payment status; can also edit allergies, history notes, consents, recalls, and insurance on the patient page.
- **Admin** — staff accounts, business hours, service price list, clinic-wide billing/revenue, public website content (**Dashboard → Website**).

Bookings are validated against clinic business hours, working days, and each dentist's holidays (**Dashboard → Settings**, admin only).

### Clinical chart (where to find it)

**Dashboard → Patients / Chart** → open a patient → scroll to:

1. **Dental chart** — odontogram + surface marks (M/D/O/B/L/I)
2. **Clinical care** — History · Plans · Perio · Consents · Recalls · Insurance · Labs
3. **Photos & X-rays** — requires Cloudinary env vars (uploads stay disabled until set)

A prior booking is **not** required to chart a patient — only that the patient record exists.

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
- **Paystack** — patients pay treatment balance from **My Appointments**. Set `PAYSTACK_SECRET_KEY`, and register `/api/webhooks/paystack` in the Paystack dashboard.
- **Cloudinary** — patient photos & X-rays. Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
- **Reminder emails** — `GET /api/cron/reminders` emails patients with an appointment tomorrow. Scheduled via `vercel.json` on Vercel (set `CRON_SECRET`). You can also trigger the same URL from n8n on Railway.
- **n8n (Railway)** — optional webhooks after booking, payment, and contact form (`N8N_WEBHOOK_*`).

## Handoff checklist

Use this before going live or transferring the project:

1. **Database** — Neon (or other Postgres) URLs in Vercel + local `.env`. Run `npx prisma migrate deploy` from `web/` (includes tooth chart + full clinical care migrations).
2. **Clerk** — production keys on Vercel; staff emails match Admin → Staff pre-provisioned rows.
3. **Paystack** — live/test secret on Vercel; webhook → `https://<domain>/api/webhooks/paystack`.
4. **Cloudinary** — set the three `CLOUDINARY_*` vars or photo uploads stay off.
5. **Resend** — `RESEND_API_KEY` + verified `EMAIL_FROM` (or accept console-only skip in staging).
6. **Cron** — `CRON_SECRET` set on Vercel so appointment reminders run.
7. **n8n** — optional; see [`n8n/README.md`](./n8n/README.md) if automations are in scope.
8. **Smoke test** — patient book → receptionist check-in → dentist chart + procedure + Rx → patient Pay → admin billing.

### Out of scope / not built

No insurance claim filing, e-prescribe network, full periodontal charting grids, or third-party lab portals — clinic records only (manual status tracking).

## Project Structure

```
web/
  prisma/schema.prisma        Database schema + migrations
  src/app/                    Routes (App Router)
  src/app/actions/            Server actions (mutations)
  src/components/             Dashboards, layout/navigation
  src/lib/                    Prisma, auth, clinic date, odontogram, payments
n8n/                          Importable automation workflows (Railway)
legacy/                       Old Flask prototype (reference only)
```
