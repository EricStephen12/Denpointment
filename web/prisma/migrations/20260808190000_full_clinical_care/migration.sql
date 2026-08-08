ALTER TABLE "tooth_findings" ADD COLUMN IF NOT EXISTS "surfaces" VARCHAR(20);

CREATE TYPE "PlanItemStatus" AS ENUM ('planned', 'in_progress', 'completed', 'cancelled');
CREATE TYPE "ConsentStatus" AS ENUM ('pending', 'signed', 'declined');
CREATE TYPE "LabCaseStatus" AS ENUM ('sent', 'in_lab', 'received', 'fitted', 'cancelled');
CREATE TYPE "RecallStatus" AS ENUM ('due', 'scheduled', 'completed', 'cancelled');

CREATE TABLE IF NOT EXISTS "allergies" (
  "allergy_id" SERIAL PRIMARY KEY,
  "patient_id" INTEGER NOT NULL,
  "name" VARCHAR(80) NOT NULL,
  "severity" VARCHAR(20),
  "notes" VARCHAR(200),
  "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "allergies_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("patient_id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "allergies_patient_id_idx" ON "allergies"("patient_id");

CREATE TABLE IF NOT EXISTS "medical_history_notes" (
  "note_id" SERIAL PRIMARY KEY,
  "patient_id" INTEGER NOT NULL,
  "dentist_id" INTEGER,
  "body" TEXT NOT NULL,
  "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "medical_history_notes_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("patient_id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "medical_history_notes_dentist_id_fkey" FOREIGN KEY ("dentist_id") REFERENCES "dentists"("dentist_id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "medical_history_notes_patient_id_recorded_at_idx" ON "medical_history_notes"("patient_id", "recorded_at");

CREATE TABLE IF NOT EXISTS "treatment_plans" (
  "plan_id" SERIAL PRIMARY KEY,
  "patient_id" INTEGER NOT NULL,
  "dentist_id" INTEGER NOT NULL,
  "title" VARCHAR(120) NOT NULL,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "treatment_plans_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("patient_id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "treatment_plans_dentist_id_fkey" FOREIGN KEY ("dentist_id") REFERENCES "dentists"("dentist_id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "treatment_plans_patient_id_idx" ON "treatment_plans"("patient_id");

CREATE TABLE IF NOT EXISTS "treatment_plan_items" (
  "item_id" SERIAL PRIMARY KEY,
  "plan_id" INTEGER NOT NULL,
  "description" VARCHAR(200) NOT NULL,
  "tooth_number" INTEGER,
  "surfaces" VARCHAR(20),
  "estimated_charge" INTEGER,
  "status" "PlanItemStatus" NOT NULL DEFAULT 'planned',
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "treatment_plan_items_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "treatment_plans"("plan_id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "treatment_plan_items_plan_id_idx" ON "treatment_plan_items"("plan_id");

CREATE TABLE IF NOT EXISTS "perio_readings" (
  "reading_id" SERIAL PRIMARY KEY,
  "patient_id" INTEGER NOT NULL,
  "dentist_id" INTEGER NOT NULL,
  "tooth_number" INTEGER NOT NULL,
  "pocket_mm" INTEGER,
  "bleeding" BOOLEAN NOT NULL DEFAULT false,
  "mobility" INTEGER NOT NULL DEFAULT 0,
  "notes" VARCHAR(200),
  "active" BOOLEAN NOT NULL DEFAULT true,
  "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "perio_readings_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("patient_id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "perio_readings_dentist_id_fkey" FOREIGN KEY ("dentist_id") REFERENCES "dentists"("dentist_id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "perio_readings_patient_id_tooth_number_active_idx" ON "perio_readings"("patient_id", "tooth_number", "active");

CREATE TABLE IF NOT EXISTS "consent_records" (
  "consent_id" SERIAL PRIMARY KEY,
  "patient_id" INTEGER NOT NULL,
  "dentist_id" INTEGER,
  "title" VARCHAR(120) NOT NULL,
  "summary" TEXT,
  "status" "ConsentStatus" NOT NULL DEFAULT 'pending',
  "signed_at" TIMESTAMP(3),
  "signed_by_name" VARCHAR(80),
  "notes" VARCHAR(200),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "consent_records_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("patient_id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "consent_records_dentist_id_fkey" FOREIGN KEY ("dentist_id") REFERENCES "dentists"("dentist_id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "consent_records_patient_id_idx" ON "consent_records"("patient_id");

CREATE TABLE IF NOT EXISTS "recalls" (
  "recall_id" SERIAL PRIMARY KEY,
  "patient_id" INTEGER NOT NULL,
  "dentist_id" INTEGER,
  "reason" VARCHAR(120) NOT NULL,
  "due_date" DATE NOT NULL,
  "status" "RecallStatus" NOT NULL DEFAULT 'due',
  "notes" VARCHAR(200),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "recalls_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("patient_id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "recalls_dentist_id_fkey" FOREIGN KEY ("dentist_id") REFERENCES "dentists"("dentist_id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "recalls_patient_id_due_date_idx" ON "recalls"("patient_id", "due_date");

CREATE TABLE IF NOT EXISTS "patient_insurance" (
  "insurance_id" SERIAL PRIMARY KEY,
  "patient_id" INTEGER NOT NULL,
  "provider" VARCHAR(80) NOT NULL,
  "policy_number" VARCHAR(60) NOT NULL,
  "member_id" VARCHAR(60),
  "group_number" VARCHAR(60),
  "notes" VARCHAR(200),
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "patient_insurance_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("patient_id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "patient_insurance_patient_id_idx" ON "patient_insurance"("patient_id");

CREATE TABLE IF NOT EXISTS "lab_cases" (
  "lab_case_id" SERIAL PRIMARY KEY,
  "patient_id" INTEGER NOT NULL,
  "dentist_id" INTEGER NOT NULL,
  "lab_name" VARCHAR(80) NOT NULL,
  "item_description" VARCHAR(200) NOT NULL,
  "tooth_number" INTEGER,
  "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "due_date" DATE,
  "status" "LabCaseStatus" NOT NULL DEFAULT 'sent',
  "notes" VARCHAR(200),
  CONSTRAINT "lab_cases_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("patient_id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "lab_cases_dentist_id_fkey" FOREIGN KEY ("dentist_id") REFERENCES "dentists"("dentist_id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "lab_cases_patient_id_status_idx" ON "lab_cases"("patient_id", "status");
