# Complete Dental Clinic Management System
## Requirements Specification

---

## 1. Overview

The goal is a **fully complete dental clinic management system** that covers every real-world operation a dental clinic runs — patient records, scheduling, clinical care, billing, communication, reporting, and a patient self-service portal.

The system has **four distinct roles**, each with a clear, non-overlapping set of responsibilities. No role should ever see a confusing screen or wonder what to do next.

---

## 2. Roles & Responsibilities

### 2.1 Admin
The clinic owner or practice manager. Sees and controls everything.

**Can do everything a Receptionist and Dentist can do, plus:**
- Manage staff — add, edit, deactivate dentists, receptionists, and other admins
- Assign room numbers to dentists
- View and edit clinic configuration (hours, working days, services, pricing)
- Manage website content and branding
- Configure email/WhatsApp automation rules
- View all financial reports and analytics
- Issue discounts, waivers, and refunds
- Export data (patient list, revenue reports, schedules)

**Dashboard shows:**
- Today's appointment count across all dentists
- Total patients on the registry
- Outstanding (unpaid) bill count
- Total revenue to date
- Quick links: Staff, Billing, Automations, Settings, Website, Reports

---

### 2.2 Receptionist
The front desk operator. Manages all patient-facing and scheduling operations. Does **not** record clinical findings or prescriptions.

**Can do:**
- Check patients in (quick one-click check-in from today's schedule)
- Record patient arrival time
- Mark no-shows
- Book appointments on behalf of any patient
- Reschedule appointments
- Cancel appointments
- Add appointment notes / special instructions
- Register new patients (walk-in registration with full demographics)
- Update patient contact details (phone, address, emergency contact)
- View patient's upcoming and past appointments
- View the full multi-dentist schedule (all chairs, all hours)
- Add patients to the waiting list when a slot is full
- Manage the recall list — see who is overdue, log call attempts, book them in
- Generate and print invoices
- Record payments (cash, card, bank transfer, insurance)
- View outstanding balances per patient
- Send manual appointment reminders via WhatsApp or email

**Cannot do:**
- Record treatments, diagnoses, or prescriptions
- Edit clinical notes, perio charts, or tooth findings
- Add or remove staff
- Change clinic settings or pricing
- View financial analytics/reports

**Dashboard shows:**
- Today's appointments with check-in status (checked in / pending / in chair / no-show)
- Upcoming bookings count (next 7 days)
- Overdue recalls count (patients who haven't been back)
- Unpaid bills count
- Quick tiles: Today's Schedule, Upcoming, Book Appointment, Patient Registry, Register Patient, Recalls, Invoicing

---

### 2.3 Dentist
The clinical operator. Manages everything inside the treatment room. Does **not** handle money or scheduling (except creating recalls).

**Can do:**
- View today's schedule (own patients only)
- View upcoming appointments (own patients only)
- View past treatments (own patients only)
- Access full patient record:
  - Tooth chart / odontogram
  - Periodontal chart (pocket depths, bleeding, recession, mobility)
  - Treatment history
  - Medical history, allergies, chronic diseases, medications
  - Clinical images (X-rays, photos)
  - Vital signs per visit
  - Consent records
- Record treatment for a visit (complaint, action, tooth number, charge, service)
- Record SOAP clinical notes (Subjective, Objective, Assessment, Plan)
- Record vital signs (blood pressure, pulse) before treatment
- Add prescriptions / medicines per treatment
- Create and manage treatment plans (multi-visit, per patient)
- Create recalls ("bring back in 6 months for cleaning")
- Upload clinical images (X-rays, before/after photos)
- Manage lab cases (send to lab, mark received, mark fitted)
- Record consent per procedure
- Create referrals to specialists
- Manage own holidays and off-days
- View own performance statistics

**Cannot do:**
- Book or reschedule appointments for patients
- Record or edit payments
- Register new patients
- Add or remove staff
- Change clinic settings

**Dashboard shows:**
- Today's patients (name, time, room)
- Upcoming appointments count
- Pending lab cases count
- Recalls created and due soon
- Quick tiles: Today's Schedule, Patients & Records, Upcoming, Past Treatments, Treatment Plans, Lab Cases, Statistics, Holidays

---

### 2.4 Patient
A registered patient accessing their own portal. Has read-only access to their own records plus self-service actions.

**Can do:**
- Book an appointment (online self-booking)
- View and cancel upcoming appointments
- View full appointment history
- View past treatments and procedures
- View prescriptions from past visits
- View their treatment plan and progress
- Pay outstanding treatment bills online (Paystack)
- Download receipts for paid treatments
- Update own contact info (phone, address)
- View clinic contact details and directions

**Cannot do:**
- See other patients' data
- Record any clinical information
- Access staff-only screens

**Dashboard shows:**
- Next upcoming appointment with timeline (booked → checked in → treatment → done)
- Outstanding balance if any
- Quick actions: Book Visit, My Appointments, Pay Bills, Update Profile, WhatsApp Clinic, Directions

---

## 3. Feature Requirements

### Phase 1 — Complete Patient Record

#### 3.1.1 Full Demographics
**Who manages it:** Receptionist (contact info), Admin (all fields), Patient (own contact info)
**Who views it:** Receptionist, Dentist, Admin

Fields required:
- First name, last name, gender, date of birth ✅ exists
- Email ✅ exists
- Phone number ✅ exists
- Street address, city ✅ exists
- **Emergency contact name** — new field
- **Emergency contact phone** — new field
- **Occupation** — new field
- **Referral source** — how did they find the clinic? (walk-in, referred by patient, Google, Instagram, other) — new field
- **Patient since** — derived from first appointment date (no new field needed)

#### 3.1.2 Medical Profile
**Who manages it:** Dentist (clinical fields), Receptionist (allergies, current meds — at intake)
**Who views it:** Dentist, Admin

Fields required:
- Chronic diseases ✅ exists (schema), needs proper edit UI
- Allergies ✅ exists (schema), needs proper UI (add/remove per allergy with severity)
- Current medications — new model `CurrentMedication` (name, dose, notes)
- Medical history notes ✅ exists (schema), needs UI on patient page
- Vital signs per visit — stored on `Treatment` (`vitalsBP`, `vitalsHR`) — new columns

#### 3.1.3 Insurance
**Who manages it:** Receptionist, Admin
**Who views it:** Receptionist, Dentist, Admin

Fields: ✅ `PatientInsurance` schema exists — needs full UI (add, edit, deactivate)

#### 3.1.4 Consents
**Who manages it:** Dentist (creates), Receptionist (marks signed at front desk)
**Who views it:** Dentist, Admin

Fields: ✅ `ConsentRecord` schema exists — needs full UI

---

### Phase 2 — Complete Scheduling

#### 3.2.1 Reschedule Appointment
**Who can do it:** Receptionist, Admin
**How it works:** Pick the existing appointment → pick new date and time from available slots → confirm → old slot freed, new slot booked

#### 3.2.2 Appointment Enrichment
New fields needed on `Appointment`:
- `notes` — free text, receptionist adds at booking (e.g. "walk-in, nervous patient")
- `type` — enum: checkup, cleaning, emergency, follow_up, consultation, extraction, other
- `confirmedAt` — timestamp when patient confirmed they're coming
- `arrivedAt` — timestamp when patient physically arrived (set on check-in)
- `noShow` — boolean, marked by receptionist if patient never arrived

#### 3.2.3 Quick Check-in Panel
**Who uses it:** Receptionist
A dedicated today's schedule view for the receptionist showing:
- Patient name, time, dentist, room
- Status badge (scheduled / confirmed / arrived / in chair / done / no-show)
- One-click "Check In" button → sets `arrivedAt`, updates status to `checked_in`
- One-click "No Show" button
- Click patient name → opens patient record

#### 3.2.4 Multi-Dentist Calendar View
**Who uses it:** Receptionist, Admin
A grid view: rows = time slots, columns = dentists. Each cell shows patient name + status badge. Clicking a cell opens that appointment.

#### 3.2.5 Waiting List
**Who manages it:** Receptionist
When booking and preferred slot is full → offer to add to waiting list for that date. If a cancellation occurs, receptionist sees who is on the waitlist and can book them.

New model: `WaitlistEntry` (patientId, requestedDate, dentistId optional, notes, createdAt, status: waiting/booked/expired)

---

### Phase 3 — Complete Clinical Records

#### 3.3.1 Treatment Plan
**Who creates it:** Dentist
**Who views it:** Dentist, Admin, Patient (own plan)

A named plan with ordered items. Each item has:
- Description of procedure
- Tooth number (optional)
- Estimated charge
- Status: planned → in_progress → completed / cancelled

✅ `TreatmentPlan` and `TreatmentPlanItem` schemas exist — need full UI

#### 3.3.2 Recalls
**Who creates it:** Dentist (at end of visit: "come back in 6 months")
**Who manages it:** Receptionist (overdue list, call log, booking)

Dentist creates a recall with:
- Reason (cleaning, review, follow-up, etc.)
- Interval (1 month, 3 months, 6 months, 12 months) → computes due date

Receptionist sees:
- Overdue recall list (sorted by most overdue first)
- Call log per recall: add attempt ("called, no answer", "left voicemail", "rescheduled")
- Book button → goes directly to booking with patient pre-filled

✅ `Recall` schema exists — need recall call log, and UI for both roles

#### 3.3.3 Lab Cases
**Who creates it:** Dentist
**Who tracks it:** Dentist, Receptionist, Admin

Statuses: sent → in_lab → received → fitted / cancelled

Fields: ✅ `LabCase` schema exists — need full UI (list, create, update status)

#### 3.3.4 Perio Chart
**Who records it:** Dentist
Full 6-point pocket depth chart per tooth, bleeding on probing, recession, mobility, furcation. Visual chart display.

✅ `PerioReading` schema exists — need chart UI

#### 3.3.5 SOAP Clinical Notes
**Who records it:** Dentist
Per treatment/visit:
- **S** — Subjective: what the patient reports (pain, discomfort, concerns)
- **O** — Objective: clinical findings (swelling, redness, probe depths)
- **A** — Assessment: diagnosis
- **P** — Plan: what was done and what follows

New columns on `Treatment`: `soapSubjective`, `soapObjective`, `soapAssessment`, `soapPlan`

#### 3.3.6 Referrals
**Who creates it:** Dentist
**Who views it:** Admin, Receptionist (to coordinate)

New model `Referral`: patientId, dentistId, specialistType (orthodontist, oral surgeon, periodontist, endodontist, other), reason, urgency, notes, createdAt, status (pending/sent/completed)

#### 3.3.7 Vital Signs
**Who records it:** Dentist (or dental nurse)
Blood pressure (systolic/diastolic) and pulse, recorded per treatment visit.
New columns on `Treatment`: `vitalsBP` (e.g. "120/80"), `vitalsHR`

#### 3.3.8 Consent Per Procedure
**Who creates it:** Dentist (generates), Receptionist (marks signed)
**Who views it:** Dentist, Admin

✅ `ConsentRecord` schema exists — need UI to create, sign, and list per patient

#### 3.3.9 Print Prescription
**Who uses it:** Dentist
A formatted, printable prescription page showing:
- Clinic header (name, address, phone)
- Patient details
- Dentist name
- Date
- List of medicines with dose, frequency, duration, instructions
- Signature line

---

### Phase 4 — Complete Billing

#### 3.4.1 Payment Model
**Who manages it:** Receptionist, Admin

New model `Payment`:
- `treatmentId` or `appointmentId`
- `amount`
- `method`: cash | card | bank_transfer | insurance | online (Paystack)
- `reference` (bank ref, Paystack ref)
- `recordedBy` (personId of receptionist/admin)
- `notes`
- `createdAt`
- `type`: payment | discount | waiver | refund

Treatment `paid` boolean to be replaced by derived state: treatment is paid when sum of payments >= charge.

#### 3.4.2 Invoice & Receipt
**Who generates it:** Receptionist, Admin
**Who views it:** Patient (own only)

Printable/downloadable invoice per appointment showing:
- Clinic header
- Patient name
- Appointment date
- Each treatment: description, tooth number, charge
- Subtotal, discount, total paid, outstanding balance
- Payment history for this appointment
- QR code or reference for online payment

#### 3.4.3 Outstanding Balance
Per patient: sum of all unpaid treatment charges minus all payments. Visible to receptionist and admin on patient record.

#### 3.4.4 Insurance Claims
**Who manages it:** Receptionist, Admin
Track: insurer name, policy number, claim amount, submission date, status (pending/approved/rejected/paid), notes.

New model `InsuranceClaim`: appointmentId, patientInsuranceId, claimAmount, submittedAt, status, settledAt, notes.

---

### Phase 5 — Reports & Analytics

**Who views it:** Admin only

All reports live under `/dashboard/admin/reports`:

- **Daily summary** — appointments, check-ins, no-shows, revenue for any selected day
- **Revenue by period** — bar/line chart, selectable: day/week/month/year
- **Revenue by service** — which procedures bring in the most
- **Revenue by dentist** — per dentist breakdown
- **Patient growth** — new patients registered over time
- **Common procedures** — ranked list of most-performed treatments
- **No-show & cancellation rate** — percentage over time
- **Recall compliance** — what % of due recalls got booked
- **Outstanding payments** — list of patients with unpaid balances, sortable by amount
- **Lab case turnaround** — average days from sent to received

---

### Phase 6 — Communication

#### 3.6.1 Automated (already partially built)
- Appointment reminders ✅ via n8n
- Birthday greetings ✅ via n8n
- Anniversary messages ✅ via n8n
- **Recall due reminders** — new: when a recall is due, send WhatsApp/email to patient
- **Post-visit follow-up** — new: 24h after appointment is marked completed, send "How are you feeling?" message

#### 3.6.2 Manual Triggers
**Who uses it:** Receptionist, Admin
- From any patient record: "Send appointment reminder" button → fires WhatsApp/email immediately
- From recall list: "Send recall reminder" per patient

#### 3.6.3 Recall Call Log
**Who uses it:** Receptionist
On each overdue recall record, log call attempts:
- Outcome: no answer / left voicemail / spoke to patient / booked / declined
- Notes
- Timestamp + who called

---

### Phase 7 — Patient Portal Improvements

**Additions to the existing patient dashboard:**

- **Treatment plan view** — read-only list of their treatment plan items with progress
- **Prescriptions history** — dedicated page listing all medicines ever prescribed, grouped by visit
- **Receipts** — download/print receipt per paid appointment
- **Update own contact info** — edit phone, address from the profile page (currently profile page exists but unclear if contact is editable)
- **Outstanding balance banner** — if they owe money, show it prominently with a Pay button
- **Recall reminder** — if they have a recall due, show "It's time for your checkup" banner with book button

---

## 4. Schema Changes Required

### New columns on existing tables

```
Appointment:
  + notes          String?   @db.VarChar(500)
  + type           AppointmentType  @default(checkup)
  + confirmedAt    DateTime?
  + arrivedAt      DateTime?
  + noShow         Boolean   @default(false)

Treatment:
  + soapSubjective  String?  @db.Text
  + soapObjective   String?  @db.Text
  + soapAssessment  String?  @db.Text
  + soapPlan        String?  @db.Text
  + vitalsBP        String?  @db.VarChar(10)   -- e.g. "120/80"
  + vitalsHR        Int?                        -- beats per minute

Person:
  + occupation           String?  @db.VarChar(80)
  + referralSource       String?  @db.VarChar(60)
  + emergencyContactName String?  @db.VarChar(80)
  + emergencyContactPhone String? @db.VarChar(20)
```

### New enum

```
enum AppointmentType {
  checkup
  cleaning
  emergency
  follow_up
  consultation
  extraction
  other
}
```

### New models

```
CurrentMedication     -- patient's ongoing medications (name, dose, notes)
WaitlistEntry         -- waiting list for a date/dentist
Referral              -- specialist referral from dentist
Payment               -- replaces simple paid boolean; tracks all payments/discounts/refunds
InsuranceClaim        -- insurance claim per appointment
RecallCallLog         -- call attempt log on a recall record
```

---

## 5. Navigation Changes by Role

### Admin sidebar
- Overview
- Administration:
  - Staff & Permissions
  - Reports & Analytics  ← new
  - Billing & Ledger
  - Clinic Hours & Rules
  - Website & Branding
  - Automations & Email
- Clinical:
  - Today's Schedule
  - Upcoming Appointments
  - Patient Registry

### Receptionist sidebar
- Overview
- Reception:
  - Today's Schedule (check-in view)
  - Multi-Dentist Calendar  ← new
  - Upcoming Appointments
  - Waiting List  ← new
  - Recall List  ← new
  - Patient Registry
  - Register New Patient  ← new direct link
- Billing:
  - Invoicing & Payments
  - Outstanding Balances  ← new

### Dentist sidebar
- Overview
- Clinical Desk:
  - Today's Schedule
  - Upcoming Appointments
  - Past Treatments
  - Patients & Records
  - Treatment Plans  ← new
  - Lab Cases  ← new
  - Referrals  ← new
  - Recalls (created by me)  ← new
  - Patient Analytics
  - Dentist Analytics
  - Holidays & Off-Days

### Patient sidebar
- Overview
- My Appointments
- My Treatment Plan  ← new
- Prescriptions  ← new
- Bills & Payments  ← new (replaces buried payment in appointments page)
- Book Appointment
- Profile & Settings

---

## 6. Build Order

| Phase | What | Schema migration? |
|---|---|---|
| 1 | Complete patient record (demographics, allergies, medical history, insurance, consents) | Yes — Person fields + CurrentMedication model |
| 2 | Complete scheduling (reschedule, notes, type, check-in panel, multi-dentist calendar, waiting list) | Yes — Appointment fields + WaitlistEntry model |
| 3 | Complete clinical records (treatment plans, recalls, lab cases, perio, SOAP, referrals, vitals, consents, print Rx) | Yes — Treatment fields + Referral + RecallCallLog |
| 4 | Complete billing (Payment model, invoices, receipts, insurance claims) | Yes — Payment + InsuranceClaim models |
| 5 | Reports & analytics | No |
| 6 | Communication (recall reminders, post-visit follow-up, manual triggers) | No |
| 7 | Patient portal improvements | No |

---

## 7. Design Principles

- Every page must make the user's next action obvious — no dead ends
- Role separation is strict — a receptionist never sees clinical forms; a dentist never sees payment forms
- Every list that can grow long (patients, appointments, recalls) must have search and filters
- Every destructive action (cancel appointment, delete record) requires confirmation
- All forms validate on the server, not just the client
- Print views for: daily schedule, prescriptions, invoices, receipts
- Mobile-friendly — receptionist and dentist both use this on tablets at the desk
