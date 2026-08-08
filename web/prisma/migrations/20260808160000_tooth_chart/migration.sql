-- Widen treatment clinical text fields and add optional FDI tooth number.
ALTER TABLE "treatments" ALTER COLUMN "description" TYPE TEXT;
ALTER TABLE "treatments" ALTER COLUMN "action" TYPE VARCHAR(200);
ALTER TABLE "treatments" ALTER COLUMN "complaint" TYPE VARCHAR(200);
ALTER TABLE "treatments" ADD COLUMN IF NOT EXISTS "tooth_number" INTEGER;

-- Odontogram findings (persistent per patient tooth).
CREATE TYPE "ToothCondition" AS ENUM (
  'healthy',
  'caries',
  'filling',
  'crown',
  'missing',
  'root_canal',
  'extraction_planned',
  'watch',
  'other'
);

CREATE TABLE IF NOT EXISTS "tooth_findings" (
  "finding_id" SERIAL PRIMARY KEY,
  "patient_id" INTEGER NOT NULL,
  "dentist_id" INTEGER NOT NULL,
  "treatment_id" INTEGER,
  "tooth_number" INTEGER NOT NULL,
  "condition" "ToothCondition" NOT NULL,
  "notes" VARCHAR(500),
  "active" BOOLEAN NOT NULL DEFAULT true,
  "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "tooth_findings_patient_id_fkey"
    FOREIGN KEY ("patient_id") REFERENCES "patients"("patient_id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "tooth_findings_dentist_id_fkey"
    FOREIGN KEY ("dentist_id") REFERENCES "dentists"("dentist_id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "tooth_findings_treatment_id_fkey"
    FOREIGN KEY ("treatment_id") REFERENCES "treatments"("treatment_id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "tooth_findings_patient_id_tooth_number_active_idx"
  ON "tooth_findings"("patient_id", "tooth_number", "active");
