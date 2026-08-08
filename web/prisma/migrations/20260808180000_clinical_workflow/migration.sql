-- Visit workflow status (keeps checked_in boolean in sync for older UI).
CREATE TYPE "AppointmentStatus" AS ENUM (
  'scheduled',
  'checked_in',
  'in_chair',
  'completed',
  'no_show',
  'cancelled'
);

ALTER TABLE "appointments"
  ADD COLUMN IF NOT EXISTS "status" "AppointmentStatus" NOT NULL DEFAULT 'scheduled';

UPDATE "appointments"
SET "status" = 'checked_in'
WHERE "checked_in" = true AND "status" = 'scheduled';

-- Structured prescriptions
ALTER TABLE "medicines" ALTER COLUMN "medicine_name" TYPE VARCHAR(80);
ALTER TABLE "medicines" ADD COLUMN IF NOT EXISTS "dose" VARCHAR(40);
ALTER TABLE "medicines" ADD COLUMN IF NOT EXISTS "frequency" VARCHAR(40);
ALTER TABLE "medicines" ADD COLUMN IF NOT EXISTS "duration" VARCHAR(40);
ALTER TABLE "medicines" ADD COLUMN IF NOT EXISTS "instructions" VARCHAR(200);

-- Clinical imaging
CREATE TYPE "ClinicalImageKind" AS ENUM ('photo', 'xray', 'other');

CREATE TABLE IF NOT EXISTS "patient_images" (
  "image_id" SERIAL PRIMARY KEY,
  "patient_id" INTEGER NOT NULL,
  "dentist_id" INTEGER NOT NULL,
  "kind" "ClinicalImageKind" NOT NULL DEFAULT 'photo',
  "url" VARCHAR(500) NOT NULL,
  "public_id" VARCHAR(200) NOT NULL,
  "caption" VARCHAR(200),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "patient_images_patient_id_fkey"
    FOREIGN KEY ("patient_id") REFERENCES "patients"("patient_id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "patient_images_dentist_id_fkey"
    FOREIGN KEY ("dentist_id") REFERENCES "dentists"("dentist_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "patient_images_patient_id_created_at_idx"
  ON "patient_images"("patient_id", "created_at");
