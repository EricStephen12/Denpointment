# Denpointment (Glow Dental Clinic) — Web Application

Modern, enterprise-grade Dental Practice Management & Patient Care System built with **Next.js 16**, **React 19**, **Prisma**, and **Tailwind CSS**.

---

## 🏛 Architecture & Codebase Design

The codebase follows Next.js App Router best practices, strictly separating **presentation**, **domain data access**, and **state mutations**. Any new developer can navigate and contribute immediately.

```
web/
├── prisma/
│   └── schema.prisma          # PostgreSQL database models (appointments, treatments, tooth findings, payments)
├── public/                    # Static assets, clinical icons, site logos
└── src/
    ├── app/                   # Next.js App Router
    │   ├── actions/           # Encapsulated Server Actions (mutations with revalidation)
    │   │   ├── appointments.ts    # Booking, scheduling, reassigning, cancellations
    │   │   ├── billing.ts         # Payments, waivers, refunds, Paystack verification
    │   │   ├── chart.ts           # Odontogram findings, conditions, procedure planning
    │   │   ├── clinical-care.ts   # Prescriptions, labs, medical history, recalls, perio
    │   │   └── patients.ts        # Patient intake, demographics, contact info
    │   ├── api/               # API routes (cron jobs, Paystack callback verification)
    │   └── dashboard/         # Role-based clinic portals (Dentist, Receptionist, Admin, Patient)
    ├── components/            # Modular React 19 UI components grouped by clinical domain
    │   ├── dashboards/        # Odontogram (4-Quadrant + Actual Mouth), Clinical Care, Imaging
    │   ├── billing/           # PaymentPanel, VerifyPaystackButton, PaystackReferenceVerifier
    │   ├── patients/          # PatientWorkspaceView, Demographics, Patient lists
    │   ├── reception/         # Daily schedule, walk-in check-in, waitlist, calendar
    │   └── admin/             # Staff management, clinic settings, pricing catalog
    └── lib/                   # Pure business logic, helpers & API wrappers
        ├── auth.ts            # Role-based capabilities (Admin, Dentist, Receptionist, Patient)
        ├── clinic-date.ts     # Clinic calendar math, time slots & business day calculations
        ├── currency.ts        # Nigerian Naira (₦) formatting helpers
        ├── email.ts           # Resend email templates (booking confirmations, receipts, alerts)
        ├── odontogram.ts      # FDI & Palmer notation, anatomical tooth shapes, quadrants
        ├── paystack.ts        # Direct Paystack API integration (webhook-free verification)
        ├── prisma.ts          # Singleton Prisma client instance
        └── tooth-surfaces.ts  # 5-surface mapping (Mesial, Occlusal, Distal, Buccal, Lingual)
```

---

## 💳 Payment Architecture: 100% Webhook-Free & Safe

### The Problem Solved
Paystack accounts only allow **one webhook URL per account**. If you share a Paystack account with another website (e.g. an e-commerce store), or if webhooks fail due to network drops, traditional systems lose track of payments.

### The Solution: Direct Server-to-Server Verification
Denpointment **does not require or trust Paystack webhooks**:

1. **Synchronous Return Verification (`/dashboard/payment/callback`)**:
   - When a patient completes payment, Paystack redirects back to the clinic's callback URL.
   - The server immediately queries Paystack's official API:
     `GET https://api.paystack.co/transaction/verify/${reference}`
   - If Paystack confirms `status === "success"`, the treatment is marked `paid: true`, an official `Payment` record is created in the database ledger, and an email receipt is dispatched.
   - If the payment failed or was abandoned, it is **never marked as paid**.

2. **On-Demand Verification (`<VerifyPaystackButton />`)**:
   - If a patient closes their browser or their phone turns off before returning, the treatment shows a **"Verify Status"** button on their bill.
   - Clinic receptionists also have a **"Verify Paystack"** button and a **"Direct Paystack Reference Verifier"** in **Admin → Billing**.
   - Clicking it queries Paystack in real time and reconciles the payment instantly.

---

## 🦷 Clinical Odontogram & Treatment Planning

The dental chart (`src/components/dashboards/Odontogram.tsx`) supports two clinical perspectives:

1. **4-Quadrant View (Palmer 1–8 & FDI 11–48)**:
   - Maxillary (Upper Right & Upper Left) and Mandibular (Lower Right & Lower Left) arches.
   - Full anatomical root morphology (incisors, canines, premolars, and bifurcated/trifurcated molars).
   - Midline and occlusal plane dividers.

2. **Actual Mouth View (Curved Anatomical Arch)**:
   - Realistic open-mouth perspective showing the natural curved horseshoe arches.
   - Maxillary arch with palate and rugae shading.
   - Mandibular arch with sublingual tongue floor.
   - Warm gingival gum margins and realistic tooth occlusal crowns.

3. **In-Mouth Location Perspective**:
   - Whenever any tooth is selected, an anatomical mini oral schematic highlights its exact position in the human mouth.
   - Explains its clinical function (e.g., *"Upper deep back chewing molar · Primary occlusal load-bearing tooth"*), position from midline, and opposing bite tooth.

4. **Surface Mapping & Planning**:
   - Interactive 5-surface target (M, O/I, D, B, L).
   - One-click condition diagnosis (Healthy Enamel, Caries, Restoration, Crown, Missing, Root Canal, Planned Extraction).
   - Procedure planning bridge linked directly to the clinic's fee catalog.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL database (Supabase, Neon, or local)
- Paystack Secret Key (`sk_test_...` or `sk_live_...`)

### Local Setup
```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL, DIRECT_URL, PAYSTACK_SECRET_KEY, and CLERK keys

# 3. Apply database migrations
npx prisma migrate deploy

# 4. Start local development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛡 Code Quality & Standards

- **TypeScript Strict Mode**: 100% typed with zero compile errors (`npx tsc --noEmit`).
- **Data Integrity**: Financial ledger transactions use `prisma.$transaction` to guarantee atomicity.
- **Server Actions**: All mutations use standard Next.js Server Actions with automatic route revalidation (`revalidatePath`).
- **Clean Components**: No massive monolithic files; clinical tools are broken into focused, testable components.
