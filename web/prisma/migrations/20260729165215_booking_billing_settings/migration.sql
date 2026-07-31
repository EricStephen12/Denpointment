-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "checked_in" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "treatments" ADD COLUMN     "paid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "service_id" INTEGER;

-- CreateTable
CREATE TABLE "services" (
    "service_id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "price" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "services_pkey" PRIMARY KEY ("service_id")
);

-- CreateTable
CREATE TABLE "clinic_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "open_hour" INTEGER NOT NULL DEFAULT 8,
    "close_hour" INTEGER NOT NULL DEFAULT 18,
    "working_days" INTEGER[] DEFAULT ARRAY[1, 2, 3, 4, 5]::INTEGER[],

    CONSTRAINT "clinic_settings_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "treatments" ADD CONSTRAINT "treatments_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("service_id") ON DELETE SET NULL ON UPDATE CASCADE;
