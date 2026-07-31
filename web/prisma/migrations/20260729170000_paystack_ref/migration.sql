-- AlterTable
ALTER TABLE "treatments" ADD COLUMN "paystack_ref" VARCHAR(100);

-- CreateIndex
CREATE UNIQUE INDEX "treatments_paystack_ref_key" ON "treatments"("paystack_ref");
