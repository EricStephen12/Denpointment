-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female');

-- CreateTable
CREATE TABLE "persons" (
    "person_id" SERIAL NOT NULL,
    "ssn" VARCHAR(15),
    "clerkId" VARCHAR(255),
    "email" VARCHAR(50) NOT NULL,
    "password" VARCHAR(100) NOT NULL,
    "first_name" VARCHAR(50) NOT NULL,
    "last_name" VARCHAR(50) NOT NULL,
    "gender" "Gender" NOT NULL,
    "birth_date" DATE,

    CONSTRAINT "persons_pkey" PRIMARY KEY ("person_id")
);

-- CreateTable
CREATE TABLE "patients" (
    "patient_id" SERIAL NOT NULL,
    "person_id" INTEGER NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("patient_id")
);

-- CreateTable
CREATE TABLE "dentists" (
    "dentist_id" SERIAL NOT NULL,
    "person_id" INTEGER NOT NULL,
    "room_number" VARCHAR(5) NOT NULL,

    CONSTRAINT "dentists_pkey" PRIMARY KEY ("dentist_id")
);

-- CreateTable
CREATE TABLE "admins" (
    "admin_id" SERIAL NOT NULL,
    "person_id" INTEGER NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("admin_id")
);

-- CreateTable
CREATE TABLE "receptionists" (
    "receptionist_id" SERIAL NOT NULL,
    "person_id" INTEGER NOT NULL,

    CONSTRAINT "receptionists_pkey" PRIMARY KEY ("receptionist_id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "appointment_id" SERIAL NOT NULL,
    "d_id" INTEGER NOT NULL,
    "p_id" INTEGER NOT NULL,
    "room" VARCHAR(5) NOT NULL,
    "hour" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "day" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("appointment_id")
);

-- CreateTable
CREATE TABLE "treatments" (
    "treatment_id" SERIAL NOT NULL,
    "description" VARCHAR(50),
    "charge" INTEGER NOT NULL,
    "action" VARCHAR(25) NOT NULL,
    "complaint" VARCHAR(25) NOT NULL,
    "a_id" INTEGER NOT NULL,
    "treator_id" INTEGER NOT NULL,

    CONSTRAINT "treatments_pkey" PRIMARY KEY ("treatment_id")
);

-- CreateTable
CREATE TABLE "medicines" (
    "medicine_id" SERIAL NOT NULL,
    "t_id" INTEGER NOT NULL,
    "medicine_name" VARCHAR(50) NOT NULL,

    CONSTRAINT "medicines_pkey" PRIMARY KEY ("medicine_id")
);

-- CreateTable
CREATE TABLE "addresses" (
    "address_id" SERIAL NOT NULL,
    "person_id" INTEGER NOT NULL,
    "city" VARCHAR(20) NOT NULL,
    "street" VARCHAR(20) NOT NULL,
    "zip_code" VARCHAR(10) NOT NULL,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("address_id")
);

-- CreateTable
CREATE TABLE "person_contact_numbers" (
    "contact_number" VARCHAR(15) NOT NULL,
    "person_id" INTEGER NOT NULL,

    CONSTRAINT "person_contact_numbers_pkey" PRIMARY KEY ("contact_number","person_id")
);

-- CreateTable
CREATE TABLE "chronic_diseases" (
    "chronic_disease" VARCHAR(50) NOT NULL,
    "person_id" INTEGER NOT NULL,

    CONSTRAINT "chronic_diseases_pkey" PRIMARY KEY ("chronic_disease","person_id")
);

-- CreateTable
CREATE TABLE "holiday_dates" (
    "holiday_id" SERIAL NOT NULL,
    "resting_id" INTEGER NOT NULL,
    "reason" VARCHAR(25),
    "rest_date" DATE NOT NULL,

    CONSTRAINT "holiday_dates_pkey" PRIMARY KEY ("holiday_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "persons_ssn_key" ON "persons"("ssn");

-- CreateIndex
CREATE UNIQUE INDEX "persons_clerkId_key" ON "persons"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "persons_email_key" ON "persons"("email");

-- CreateIndex
CREATE UNIQUE INDEX "patients_person_id_key" ON "patients"("person_id");

-- CreateIndex
CREATE UNIQUE INDEX "dentists_person_id_key" ON "dentists"("person_id");

-- CreateIndex
CREATE UNIQUE INDEX "admins_person_id_key" ON "admins"("person_id");

-- CreateIndex
CREATE UNIQUE INDEX "receptionists_person_id_key" ON "receptionists"("person_id");

-- CreateIndex
CREATE UNIQUE INDEX "appointments_d_id_year_month_day_hour_key" ON "appointments"("d_id", "year", "month", "day", "hour");

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "persons"("person_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dentists" ADD CONSTRAINT "dentists_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "persons"("person_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admins" ADD CONSTRAINT "admins_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "persons"("person_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receptionists" ADD CONSTRAINT "receptionists_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "persons"("person_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_d_id_fkey" FOREIGN KEY ("d_id") REFERENCES "dentists"("dentist_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_p_id_fkey" FOREIGN KEY ("p_id") REFERENCES "patients"("patient_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatments" ADD CONSTRAINT "treatments_a_id_fkey" FOREIGN KEY ("a_id") REFERENCES "appointments"("appointment_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatments" ADD CONSTRAINT "treatments_treator_id_fkey" FOREIGN KEY ("treator_id") REFERENCES "dentists"("dentist_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicines" ADD CONSTRAINT "medicines_t_id_fkey" FOREIGN KEY ("t_id") REFERENCES "treatments"("treatment_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "persons"("person_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_contact_numbers" ADD CONSTRAINT "person_contact_numbers_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "persons"("person_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chronic_diseases" ADD CONSTRAINT "chronic_diseases_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "persons"("person_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holiday_dates" ADD CONSTRAINT "holiday_dates_resting_id_fkey" FOREIGN KEY ("resting_id") REFERENCES "dentists"("dentist_id") ON DELETE RESTRICT ON UPDATE CASCADE;
