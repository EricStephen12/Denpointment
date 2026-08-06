-- AlterTable
ALTER TABLE "persons" ALTER COLUMN "password" DROP NOT NULL;

-- CreateTable
CREATE TABLE "site_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "clinic_name" VARCHAR(60),
    "tagline" VARCHAR(200),
    "phone" VARCHAR(20),
    "email" VARCHAR(60),
    "address" VARCHAR(120),
    "hours_label" VARCHAR(60),
    "location" VARCHAR(60),
    "hero_line_1" VARCHAR(40),
    "hero_line_2" VARCHAR(40),
    "philosophy_line_1" VARCHAR(200),
    "philosophy_line_2" VARCHAR(200),
    "rating" VARCHAR(4),
    "review_count" VARCHAR(10),
    "accent_color" VARCHAR(20),
    "packages" JSONB,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);
