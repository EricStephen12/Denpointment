-- Add demographic fields to persons
ALTER TABLE "persons" ADD COLUMN IF NOT EXISTS "occupation" VARCHAR(80);
ALTER TABLE "persons" ADD COLUMN IF NOT EXISTS "referral_source" VARCHAR(60);
ALTER TABLE "persons" ADD COLUMN IF NOT EXISTS "emergency_contact_name" VARCHAR(80);
ALTER TABLE "persons" ADD COLUMN IF NOT EXISTS "emergency_contact_phone" VARCHAR(20);

-- Create current_medications table
CREATE TABLE IF NOT EXISTS "current_medications" (
    "medication_id" SERIAL PRIMARY KEY,
    "patient_id" INTEGER NOT NULL REFERENCES "patients"("patient_id") ON DELETE CASCADE,
    "name" VARCHAR(100) NOT NULL,
    "dose" VARCHAR(60),
    "notes" VARCHAR(200),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "current_medications_patient_id_active_idx"
    ON "current_medications"("patient_id", "active");
