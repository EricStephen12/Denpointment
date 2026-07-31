"use server"

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isAdmin, isReceptionist } from "@/lib/auth";
import { initializePaystackTransaction } from "@/lib/paystack";

async function requireBillingAccess() {
  const person = await getCurrentPerson();
  if (!person || (!isAdmin(person) && !isReceptionist(person))) {
    throw new Error("You're not authorized to manage billing.");
  }
}

export async function markTreatmentPaid(formData: FormData) {
  await requireBillingAccess();

  const treatmentId = parseInt(formData.get("treatmentId") as string, 10);
  const paid = formData.get("paid") === "true";

  await prisma.treatment.update({ where: { treatmentId }, data: { paid: !paid } });

  revalidatePath("/dashboard/billing");
  revalidatePath("/dashboard/admin/billing");
}

/**
 * Starts a Paystack checkout for a patient to pay their own unpaid
 * treatment balance online.
 */
export async function initiateTreatmentPayment(formData: FormData) {
  const person = await getCurrentPerson();
  if (!person) throw new Error("Not authenticated");

  const treatmentId = parseInt(formData.get("treatmentId") as string, 10);
  if (!treatmentId) throw new Error("Missing treatment.");

  const treatment = await prisma.treatment.findUnique({
    where: { treatmentId },
    include: { appointment: true },
  });
  if (!treatment) throw new Error("Treatment not found.");

  const isOwner = person.patients.some((p) => p.patientId === treatment.appointment.pId);
  if (!isOwner) throw new Error("You can only pay for your own treatments.");
  if (treatment.paid) throw new Error("This treatment has already been paid for.");

  const reference = `treatment-${treatmentId}-${Date.now()}`;
  const host = (await headers()).get("host");
  const protocol = host?.includes("localhost") ? "http" : "https";
  const callbackUrl = `${protocol}://${host}/dashboard/payment/callback`;

  const { authorization_url } = await initializePaystackTransaction({
    email: person.email,
    amount: treatment.charge,
    reference,
    callbackUrl,
    metadata: { treatmentId },
  });

  await prisma.treatment.update({ where: { treatmentId }, data: { paystackRef: reference } });

  redirect(authorization_url);
}
