# Complete Dental Clinic Management System
## Implementation Tasks

---

## PHASE 1 — Complete Patient Record

- [ ] **1.1** Schema migration — add `occupation`, `referralSource`, `emergencyContactName`, `emergencyContactPhone` to `Person`
- [ ] **1.2** Schema migration — create `CurrentMedication` model (patientId, name, dose, notes, active, createdAt)
- [ ] **1.3** Server actions — update patient demographics (occupation, referral source, emergency contact)
- [ ] **1.4** Server actions — CRUD for allergies (add, update severity/notes, remove)
- [ ] **1.5** Server actions — CRUD for current medications
- [ ] **1.6** Server actions — CRUD for medical history notes
- [ ] **1.7** Server actions — CRUD for chronic diseases
- [ ] **1.8** Server actions — CRUD for patient insurance policies
- [ ] **1.9** Server actions — CRUD for consent records
- [ ] **1.10** UI — rebuild patient profile page with tabbed sections: Demographics | Medical | Insurance | Consents | Images
- [ ] **1.11** UI — demographics tab: all fields editable by receptionist/admin, read-only for dentist
- [ ] **1.12** UI — medical tab: allergies list with add/remove, current medications list, chronic diseases, medical history notes
- [ ] **1.13** UI — insurance tab: list of policies with add/edit/deactivate
- [ ] **1.14** UI — consents tab: list consent records, mark as signed, add new
- [ ] **1.15** UI — show "Patient since" derived from first appointment date on patient header
- [ ] **1.16** UI — patient header card (visible on all patient sub-pages): name, DOB, phone, patient since, outstanding balance badge

---

## PHASE 2 — Complete Scheduling

- [ ] **2.1** Schema migration — add `notes`, `type` (enum), `confirmedAt`, `arrivedAt`, `noShow` to `Appointment`
- [ ] **2.2** Schema migration — create `WaitlistEntry` model
- [ ] **2.3** Schema migration — add `AppointmentType` enum to Prisma
- [ ] **2.4** Server action — reschedule appointment (validate new slot available, move booking)
- [ ] **2.5** Server action — quick check-in (set arrivedAt, update status to checked_in)
- [ ] **2.6** Server action — mark no-show
- [ ] **2.7** Server action — confirm appointment (set confirmedAt)
- [ ] **2.8** Server action — add/remove appointment notes
- [ ] **2.9** Server action — waiting list CRUD (add entry, mark booked/expired)
- [ ] **2.10** UI — booking form: add appointment type selector and notes field
- [ ] **2.11** UI — receptionist today's schedule: dedicated check-in panel (name, time, dentist, room, status badge, Check In button, No Show button)
- [ ] **2.12** UI — multi-dentist calendar grid (rows = hours, columns = dentists, cells show patient + status)
- [ ] **2.13** UI — reschedule modal on any appointment card (receptionist/admin only)
- [ ] **2.14** UI — waiting list page under receptionist navigation
- [ ] **2.15** UI — appointment detail view: show notes, type, confirmation status, arrival time

---

## PHASE 3 — Complete Clinical Records

- [ ] **3.1** Schema migration — add `soapSubjective`, `soapObjective`, `soapAssessment`, `soapPlan`, `vitalsBP`, `vitalsHR` to `Treatment`
- [ ] **3.2** Schema migration — create `Referral` model
- [ ] **3.3** Schema migration — create `RecallCallLog` model (recallId, outcome enum, notes, calledAt, calledBy personId)
- [ ] **3.4** Server actions — treatment plan CRUD (create plan, add items, update item status, delete)
- [ ] **3.5** Server actions — recall CRUD (create, update status) + call log (add attempt)
- [ ] **3.6** Server actions — lab case CRUD (create, update status)
- [ ] **3.7** Server actions — referral CRUD (create, update status)
- [ ] **3.8** Server actions — consent record CRUD (create, sign, decline)
- [ ] **3.9** Server actions — perio readings CRUD (save full chart for a visit)
- [ ] **3.10** Server actions — vital signs (save BP and HR on treatment record)
- [ ] **3.11** UI — treatment form: add SOAP notes fields (collapsible), vital signs fields, consent link
- [ ] **3.12** UI — treatment plan builder on patient page (dentist only): create plan, add/reorder items, mark items done
- [ ] **3.13** UI — recall creation UI on today's schedule (dentist sets interval after treatment)
- [ ] **3.14** UI — recall overdue list page (receptionist): sorted by most overdue, call log, book button
- [ ] **3.15** UI — lab cases page: create new case, status tracker per case, list all open cases
- [ ] **3.16** UI — referrals section on patient page (dentist creates, all staff view)
- [ ] **3.17** UI — perio chart UI: 6-point grid per tooth, visual colour coding for pocket depth
- [ ] **3.18** UI — print prescription page: formatted printable layout with clinic header, patient, dentist, medicines
- [ ] **3.19** UI — lab cases in dentist sidebar navigation

---

## PHASE 4 — Complete Billing

- [ ] **4.1** Schema migration — create `Payment` model (amount, method enum, reference, recordedBy, notes, type: payment/discount/waiver/refund, createdAt)
- [ ] **4.2** Schema migration — create `InsuranceClaim` model
- [ ] **4.3** Schema migration — link payments to appointments (not just individual treatments)
- [ ] **4.4** Server action — record payment (cash/card/transfer/insurance, partial or full)
- [ ] **4.5** Server action — record discount or waiver (amount + reason)
- [ ] **4.6** Server action — record refund
- [ ] **4.7** Server action — submit insurance claim, update claim status
- [ ] **4.8** Server action — generate invoice data for an appointment
- [ ] **4.9** UI — billing page: list appointments with outstanding balance, record payment inline
- [ ] **4.10** UI — patient ledger on patient record: full payment history, balance owed
- [ ] **4.11** UI — printable invoice component: clinic header, patient details, treatments, payments, balance
- [ ] **4.12** UI — printable receipt component: single payment confirmation
- [ ] **4.13** UI — insurance claims list and status tracker (receptionist/admin)
- [ ] **4.14** UI — outstanding balances summary page (receptionist/admin)

---

## PHASE 5 — Reports & Analytics

- [ ] **5.1** UI — reports landing page at `/dashboard/admin/reports`
- [ ] **5.2** UI — daily summary report: appointments, check-ins, no-shows, revenue for selected date
- [ ] **5.3** UI — revenue by period chart (day/week/month/year selector, bar chart)
- [ ] **5.4** UI — revenue by service breakdown (horizontal bar chart, ranked)
- [ ] **5.5** UI — revenue by dentist breakdown
- [ ] **5.6** UI — patient growth chart (new registrations over time)
- [ ] **5.7** UI — most common procedures table
- [ ] **5.8** UI — no-show and cancellation rate over time
- [ ] **5.9** UI — recall compliance rate
- [ ] **5.10** UI — outstanding payments report (list, sortable by amount/patient)
- [ ] **5.11** UI — lab case turnaround average stat
- [ ] **5.12** Add Reports & Analytics to admin sidebar navigation

---

## PHASE 6 — Communication

- [ ] **6.1** Server action — manual appointment reminder trigger (send WhatsApp/email to patient)
- [ ] **6.2** Server action — manual recall reminder trigger
- [ ] **6.3** UI — "Send Reminder" button on each appointment row (receptionist/admin)
- [ ] **6.4** UI — "Send Recall Reminder" button on recall list (receptionist)
- [ ] **6.5** n8n / automation — recall due reminder workflow (trigger when recall dueDate is today or past)
- [ ] **6.6** n8n / automation — post-visit follow-up (24h after appointment marked completed)
- [ ] **6.7** UI — automation settings: add recall reminder and post-visit follow-up toggles in admin automation page

---

## PHASE 7 — Patient Portal Improvements

- [ ] **7.1** UI — treatment plan view on patient dashboard (read-only progress of their plan)
- [ ] **7.2** UI — prescriptions history page (all medicines from all visits, grouped by date)
- [ ] **7.3** UI — bills & payments page: outstanding balance, payment history, Pay button per unpaid treatment
- [ ] **7.4** UI — download/print receipt per paid appointment
- [ ] **7.5** UI — update own contact info from profile page (phone, address)
- [ ] **7.6** UI — outstanding balance banner on patient dashboard if balance > 0
- [ ] **7.7** UI — recall due banner on patient dashboard ("Time for your checkup") with Book button
- [ ] **7.8** Patient sidebar: add Treatment Plan, Prescriptions, Bills & Payments links

---

## PHASE 8 — Navigation & Role Cleanup

- [ ] **8.1** Rebuild admin sidebar with full navigation including Reports
- [ ] **8.2** Rebuild receptionist sidebar: Today's Schedule, Multi-Dentist Calendar, Upcoming, Waiting List, Recall List, Patient Registry, Register Patient, Invoicing, Outstanding Balances
- [ ] **8.3** Rebuild dentist sidebar: Today's Schedule, Upcoming, Past Treatments, Patients & Records, Treatment Plans, Lab Cases, Referrals, Recalls, Analytics, Holidays
- [ ] **8.4** Rebuild patient sidebar: Overview, My Appointments, Treatment Plan, Prescriptions, Bills & Payments, Book Appointment, Profile
- [ ] **8.5** Update receptionist dashboard tiles to reflect new full role
- [ ] **8.6** Update dentist dashboard tiles to reflect new full role
- [ ] **8.7** Update admin dashboard to include Reports link
- [ ] **8.8** Update patient dashboard: add balance banner, recall due banner

---

## Total task count: 80 tasks across 8 phases
