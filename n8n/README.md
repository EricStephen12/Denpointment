# Glow Dental × n8n — complete automation guide

**Site (Vercel)** fires events → **n8n (Railway)** runs the automation.

```
Patient books / pays / contacts
        │
        ▼
  Vercel Next.js app
  (notifyN8n → POST JSON)
        │
        ▼
  n8n Webhook (Railway)
        │
        ├── Email patient / clinic
        ├── WhatsApp / SMS (optional)
        └── Slack / log (optional)
```

The site already sends these three events (when env vars are set):

| Event | Env var on Vercel | Path to use in n8n Webhook |
|-------|-------------------|----------------------------|
| New booking | `N8N_WEBHOOK_BOOKING` | `booking` |
| Payment received | `N8N_WEBHOOK_PAYMENT` | `payment` |
| Contact form | `N8N_WEBHOOK_CONTACT` | `contact` |

---

## Part 1 — Put n8n on Railway (once)

1. Railway → **New Project** → deploy **n8n** template.
2. **Settings → Networking** → generate a public domain  
   Example: `https://n8n-production-xxxx.up.railway.app`
3. On the n8n service, set:
   - `WEBHOOK_URL` = `https://n8n-production-xxxx.up.railway.app/`  
     (must match your public URL, with trailing `/`)
4. Open that URL → create your **owner account** (this is local to Railway, not Docker).
5. You are in the n8n editor.

---

## Part 2 — Build workflow #1: Booking confirmation (teach-by-doing)

### What the site sends

```json
{
  "event": "booking",
  "sentAt": "2026-08-06T17:00:00.000Z",
  "patientName": "Ada Okeke",
  "patientEmail": "ada@example.com",
  "dentistName": "Tunde Bello",
  "room": "3",
  "date": "2026-08-10",
  "hour": 10,
  "staffBooking": false
}
```

### Build it in n8n

1. **Workflows → Add workflow** → name it `Glow - Booking`.
2. Add node **Webhook**:
   - HTTP Method: `POST`
   - Path: `booking`
   - Authentication: None (for now; add Header Auth later if you want)
   - Respond: `Immediately` (or “When Last Node Finishes”)
3. Click **Listen for test event** (or save + use Test URL).
4. Add node **Email Send** (or **Gmail** / **Resend** if you use those):
   - To: `{{ $json.patientEmail }}`
   - Subject: `Appointment confirmed — {{ $json.date }} at {{ $json.hour }}:00`
   - Body:
     ```
     Hi {{ $json.patientName }},

     Your appointment with Dr. {{ $json.dentistName }} is booked.
     Date: {{ $json.date }}
     Time: {{ $json.hour }}:00
     Room: {{ $json.room }}

     Glow Dental
     ```
5. (Optional) Add a second email to the clinic: To = your clinic email, subject `New booking`.
6. **Save** → toggle **Active** (top right).
7. Open the Webhook node → copy the **Production URL**  
   Example: `https://n8n-….up.railway.app/webhook/booking`

### Connect Vercel

In Vercel → Project → **Settings → Environment Variables**:

```
N8N_WEBHOOK_BOOKING=https://n8n-….up.railway.app/webhook/booking
```

Redeploy. Book a test appointment → check n8n **Executions**.

---

## Part 3 — Workflow #2: Payment received

### Payload from the site

```json
{
  "event": "payment",
  "patientName": "Ada Okeke",
  "patientEmail": "ada@example.com",
  "amount": 25000,
  "serviceName": "Cleaning",
  "reference": "treatment-12-…"
}
```

### Build

1. New workflow `Glow - Payment`.
2. **Webhook** POST path `payment`.
3. **Email Send** to `{{ $json.patientEmail }}`:
   - Subject: `Payment received — {{ $json.serviceName }}`
   - Body: thank them, include `amount` and `reference`.
4. Activate → copy Production URL → set on Vercel:

```
N8N_WEBHOOK_PAYMENT=https://n8n-….up.railway.app/webhook/payment
```

---

## Part 4 — Workflow #3: Contact form → clinic inbox

### Payload

```json
{
  "event": "contact",
  "name": "Visitor",
  "email": "visitor@example.com",
  "message": "Do you offer whitening?",
  "clinicEmail": "hello@glowdentalclinic.com"
}
```

### Build

1. Workflow `Glow - Contact`.
2. **Webhook** POST path `contact`.
3. **Email Send** to `{{ $json.clinicEmail }}`:
   - Reply-To: `{{ $json.email }}`
   - Subject: `Website inquiry from {{ $json.name }}`
   - Body: `{{ $json.message }}`
4. Activate → Vercel:

```
N8N_WEBHOOK_CONTACT=https://n8n-….up.railway.app/webhook/contact
```

---

## Part 5 — Workflow #4: Daily reminders (n8n calls Vercel)

This one is the reverse direction: **n8n → your site**.

1. Workflow `Glow - Daily reminders`.
2. Add **Schedule Trigger** → every day at 09:00 (Africa/Lagos).
3. Add **HTTP Request**:
   - Method: `GET`
   - URL: `https://YOUR-VERCEL-DOMAIN/api/cron/reminders`
   - Header: `Authorization` = `Bearer YOUR_CRON_SECRET`
4. Activate.

Your site already emails patients with appointments tomorrow; n8n just wakes that endpoint if you prefer it over Vercel Cron.

---

## Part 6 — Import starter workflows (optional)

JSON files in this folder can be imported:

**n8n → … menu → Import from File**

| File | Purpose |
|------|---------|
| `glow-booking.json` | Webhook `booking` + set fields (add your Email node) |
| `glow-payment.json` | Webhook `payment` |
| `glow-contact.json` | Webhook `contact` |
| `glow-reminders-cron.json` | Schedule → GET Vercel cron |

After import: open each Webhook → copy Production URL → paste into Vercel env → **Activate**.

---

## How to test without breaking production

1. In n8n Webhook, use **Test URL** first and click Listen.
2. From PowerShell:

```powershell
Invoke-RestMethod -Method POST -Uri "https://YOUR-N8N/webhook-test/booking" -ContentType "application/json" -Body '{"event":"booking","patientName":"Test User","patientEmail":"you@email.com","dentistName":"Test Dentist","room":"1","date":"2026-08-10","hour":10,"staffBooking":false}'
```

3. When it works, switch to **Production URL** and activate the workflow.

---

## Checklist

- [ ] n8n live on Railway with public domain + `WEBHOOK_URL`
- [ ] Three workflows Active (booking, payment, contact)
- [ ] Email credentials connected in n8n (Gmail / SMTP / Resend)
- [ ] Three `N8N_WEBHOOK_*` vars set on Vercel + redeploy
- [ ] Test booking → see Execution in n8n
- [ ] (Optional) Daily reminder schedule → Vercel `/api/cron/reminders`

When you’re stuck, open n8n **Executions** — red = failed node; click it to see the error.
