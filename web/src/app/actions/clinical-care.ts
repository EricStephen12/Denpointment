"use server";

import { revalidatePath } from "next/cache";
import type {
  ConsentStatus,
  LabCaseStatus,
  PlanItemStatus,
  RecallStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isDentist, isReceptionist, isAdmin } from "@/lib/auth";
import { isValidFdiTooth } from "@/lib/odontogram";
import { parseSurfacesFromForm } from "@/lib/tooth-surfaces";

async function requireClinicalEditor() {
  const person = await getCurrentPerson();
  if (!person || (!isDentist(person) && !isReceptionist(person) && !isAdmin(person))) {
    throw new Error("Not authorized.");
  }
  return person;
}

async function requireDentistId() {
  const person = await getCurrentPerson();
  if (!person || !isDentist(person)) throw new Error("Dentists only.");
  return person.dentists[0].dentistId;
}

function revalidatePatient(patientId: number) {
  revalidatePath(`/dashboard/patients/${patientId}`);
}

export async function addAllergy(formData: FormData) {
  await requireClinicalEditor();
  const patientId = parseInt(formData.get("patientId") as string, 10);
  const name = ((formData.get("name") as string) || "").trim().slice(0, 80);
  const severity = ((formData.get("severity") as string) || "").trim().slice(0, 20);
  const notes = ((formData.get("notes") as string) || "").trim().slice(0, 200);
  if (!patientId || !name) throw new Error("Allergy name is required.");
  await prisma.allergy.create({
    data: { patientId, name, severity: severity || null, notes: notes || null },
  });
  revalidatePatient(patientId);
}

export async function deleteAllergy(formData: FormData) {
  await requireClinicalEditor();
  const allergyId = parseInt(formData.get("allergyId") as string, 10);
  const row = await prisma.allergy.findUnique({ where: { allergyId } });
  if (!row) throw new Error("Allergy not found.");
  await prisma.allergy.delete({ where: { allergyId } });
  revalidatePatient(row.patientId);
}

export async function addMedicalNote(formData: FormData) {
  const person = await requireClinicalEditor();
  const patientId = parseInt(formData.get("patientId") as string, 10);
  const body = ((formData.get("body") as string) || "").trim().slice(0, 4000);
  if (!patientId || !body) throw new Error("Note text is required.");
  await prisma.medicalHistoryNote.create({
    data: {
      patientId,
      body,
      dentistId: isDentist(person) ? person.dentists[0].dentistId : null,
    },
  });
  revalidatePatient(patientId);
}

export async function createTreatmentPlan(formData: FormData) {
  const dentistId = await requireDentistId();
  const patientId = parseInt(formData.get("patientId") as string, 10);
  const title = ((formData.get("title") as string) || "").trim().slice(0, 120);
  const notes = ((formData.get("notes") as string) || "").trim().slice(0, 4000);
  if (!patientId || !title) throw new Error("Plan title is required.");
  await prisma.treatmentPlan.create({
    data: { patientId, dentistId, title, notes: notes || null },
  });
  revalidatePatient(patientId);
}

export async function addPlanItem(formData: FormData) {
  await requireDentistId();
  const planId = parseInt(formData.get("planId") as string, 10);
  const description = ((formData.get("description") as string) || "").trim().slice(0, 200);
  const toothRaw = (formData.get("toothNumber") as string) || "";
  const toothNumber = toothRaw ? parseInt(toothRaw, 10) : null;
  const surfaces = parseSurfacesFromForm(formData.get("surfaces"));
  const chargeRaw = (formData.get("estimatedCharge") as string) || "";
  const estimatedCharge = chargeRaw ? parseInt(chargeRaw, 10) : null;
  if (!planId || !description) throw new Error("Item description is required.");
  if (toothNumber != null && !isValidFdiTooth(toothNumber)) {
    throw new Error("Invalid tooth number.");
  }
  const plan = await prisma.treatmentPlan.findUnique({ where: { planId } });
  if (!plan) throw new Error("Plan not found.");
  const count = await prisma.treatmentPlanItem.count({ where: { planId } });
  await prisma.treatmentPlanItem.create({
    data: {
      planId,
      description,
      toothNumber,
      surfaces,
      estimatedCharge: estimatedCharge != null && !Number.isNaN(estimatedCharge) ? estimatedCharge : null,
      sortOrder: count,
    },
  });
  revalidatePatient(plan.patientId);
}

export async function updatePlanItemStatus(formData: FormData) {
  await requireDentistId();
  const itemId = parseInt(formData.get("itemId") as string, 10);
  const status = (formData.get("status") as string) as PlanItemStatus;
  const allowed: PlanItemStatus[] = ["planned", "in_progress", "completed", "cancelled"];
  if (!itemId || !allowed.includes(status)) throw new Error("Invalid plan item status.");
  const item = await prisma.treatmentPlanItem.update({
    where: { itemId },
    data: { status },
    include: { plan: true },
  });
  revalidatePatient(item.plan.patientId);
}

export async function upsertPerioReading(formData: FormData) {
  const dentistId = await requireDentistId();
  const patientId = parseInt(formData.get("patientId") as string, 10);
  const toothNumber = parseInt(formData.get("toothNumber") as string, 10);
  const pocketRaw = (formData.get("pocketMm") as string) || "";
  const pocketMm = pocketRaw ? parseInt(pocketRaw, 10) : null;
  const bleeding = formData.get("bleeding") === "on" || formData.get("bleeding") === "true";
  const mobility = parseInt((formData.get("mobility") as string) || "0", 10);
  const notes = ((formData.get("notes") as string) || "").trim().slice(0, 200);
  if (!patientId || !isValidFdiTooth(toothNumber)) throw new Error("Valid tooth required.");
  if (pocketMm != null && (Number.isNaN(pocketMm) || pocketMm < 0 || pocketMm > 15)) {
    throw new Error("Pocket depth must be 0–15 mm.");
  }
  if (Number.isNaN(mobility) || mobility < 0 || mobility > 3) {
    throw new Error("Mobility must be 0–3.");
  }
  await prisma.$transaction([
    prisma.perioReading.updateMany({
      where: { patientId, toothNumber, active: true },
      data: { active: false },
    }),
    prisma.perioReading.create({
      data: {
        patientId,
        dentistId,
        toothNumber,
        pocketMm,
        bleeding,
        mobility,
        notes: notes || null,
        active: true,
      },
    }),
  ]);
  revalidatePatient(patientId);
}

export async function addConsent(formData: FormData) {
  const person = await requireClinicalEditor();
  const patientId = parseInt(formData.get("patientId") as string, 10);
  const title = ((formData.get("title") as string) || "").trim().slice(0, 120);
  const summary = ((formData.get("summary") as string) || "").trim().slice(0, 4000);
  if (!patientId || !title) throw new Error("Consent title is required.");
  await prisma.consentRecord.create({
    data: {
      patientId,
      title,
      summary: summary || null,
      dentistId: isDentist(person) ? person.dentists[0].dentistId : null,
    },
  });
  revalidatePatient(patientId);
}

export async function updateConsentStatus(formData: FormData) {
  await requireClinicalEditor();
  const consentId = parseInt(formData.get("consentId") as string, 10);
  const status = (formData.get("status") as string) as ConsentStatus;
  const signedByName = ((formData.get("signedByName") as string) || "").trim().slice(0, 80);
  const allowed: ConsentStatus[] = ["pending", "signed", "declined"];
  if (!consentId || !allowed.includes(status)) throw new Error("Invalid consent status.");
  const row = await prisma.consentRecord.update({
    where: { consentId },
    data: {
      status,
      signedByName: status === "signed" ? signedByName || null : null,
      signedAt: status === "signed" ? new Date() : null,
    },
  });
  revalidatePatient(row.patientId);
}

export async function addRecall(formData: FormData) {
  const person = await requireClinicalEditor();
  const patientId = parseInt(formData.get("patientId") as string, 10);
  const reason = ((formData.get("reason") as string) || "").trim().slice(0, 120);
  const dueDateRaw = (formData.get("dueDate") as string) || "";
  const notes = ((formData.get("notes") as string) || "").trim().slice(0, 200);
  if (!patientId || !reason || !dueDateRaw) throw new Error("Reason and due date required.");
  await prisma.recall.create({
    data: {
      patientId,
      reason,
      dueDate: new Date(`${dueDateRaw}T12:00:00.000Z`),
      notes: notes || null,
      dentistId: isDentist(person) ? person.dentists[0].dentistId : null,
    },
  });
  revalidatePatient(patientId);
}

export async function updateRecallStatus(formData: FormData) {
  await requireClinicalEditor();
  const recallId = parseInt(formData.get("recallId") as string, 10);
  const status = (formData.get("status") as string) as RecallStatus;
  const allowed: RecallStatus[] = ["due", "scheduled", "completed", "cancelled"];
  if (!recallId || !allowed.includes(status)) throw new Error("Invalid recall status.");
  const row = await prisma.recall.update({ where: { recallId }, data: { status } });
  revalidatePatient(row.patientId);
}

export async function addInsurance(formData: FormData) {
  await requireClinicalEditor();
  const patientId = parseInt(formData.get("patientId") as string, 10);
  const provider = ((formData.get("provider") as string) || "").trim().slice(0, 80);
  const policyNumber = ((formData.get("policyNumber") as string) || "").trim().slice(0, 60);
  const memberId = ((formData.get("memberId") as string) || "").trim().slice(0, 60);
  const groupNumber = ((formData.get("groupNumber") as string) || "").trim().slice(0, 60);
  const notes = ((formData.get("notes") as string) || "").trim().slice(0, 200);
  if (!patientId || !provider || !policyNumber) {
    throw new Error("Provider and policy number are required.");
  }
  await prisma.patientInsurance.create({
    data: {
      patientId,
      provider,
      policyNumber,
      memberId: memberId || null,
      groupNumber: groupNumber || null,
      notes: notes || null,
    },
  });
  revalidatePatient(patientId);
}

export async function deactivateInsurance(formData: FormData) {
  await requireClinicalEditor();
  const insuranceId = parseInt(formData.get("insuranceId") as string, 10);
  const row = await prisma.patientInsurance.update({
    where: { insuranceId },
    data: { active: false },
  });
  revalidatePatient(row.patientId);
}

export async function addLabCase(formData: FormData) {
  const dentistId = await requireDentistId();
  const patientId = parseInt(formData.get("patientId") as string, 10);
  const labName = ((formData.get("labName") as string) || "").trim().slice(0, 80);
  const itemDescription = ((formData.get("itemDescription") as string) || "").trim().slice(0, 200);
  const toothRaw = (formData.get("toothNumber") as string) || "";
  const toothNumber = toothRaw ? parseInt(toothRaw, 10) : null;
  const dueDateRaw = (formData.get("dueDate") as string) || "";
  const notes = ((formData.get("notes") as string) || "").trim().slice(0, 200);
  if (!patientId || !labName || !itemDescription) {
    throw new Error("Lab name and item description are required.");
  }
  if (toothNumber != null && !isValidFdiTooth(toothNumber)) {
    throw new Error("Invalid tooth number.");
  }
  await prisma.labCase.create({
    data: {
      patientId,
      dentistId,
      labName,
      itemDescription,
      toothNumber,
      dueDate: dueDateRaw ? new Date(`${dueDateRaw}T12:00:00.000Z`) : null,
      notes: notes || null,
    },
  });
  revalidatePatient(patientId);
}

export async function updateLabCaseStatus(formData: FormData) {
  await requireDentistId();
  const labCaseId = parseInt(formData.get("labCaseId") as string, 10);
  const status = (formData.get("status") as string) as LabCaseStatus;
  const allowed: LabCaseStatus[] = ["sent", "in_lab", "received", "fitted", "cancelled"];
  if (!labCaseId || !allowed.includes(status)) throw new Error("Invalid lab status.");
  const row = await prisma.labCase.update({ where: { labCaseId }, data: { status } });
  revalidatePatient(row.patientId);
}

export async function addCurrentMedication(formData: FormData) {
  await requireClinicalEditor();
  const patientId = parseInt(formData.get("patientId") as string, 10);
  const name = ((formData.get("name") as string) || "").trim().slice(0, 100);
  const dose = ((formData.get("dose") as string) || "").trim().slice(0, 60);
  const notes = ((formData.get("notes") as string) || "").trim().slice(0, 200);
  if (!patientId || !name) throw new Error("Medication name is required.");
  await prisma.currentMedication.create({
    data: { patientId, name, dose: dose || null, notes: notes || null },
  });
  revalidatePatient(patientId);
}

export async function removeCurrentMedication(formData: FormData) {
  await requireClinicalEditor();
  const medicationId = parseInt(formData.get("medicationId") as string, 10);
  const row = await prisma.currentMedication.findUnique({ where: { medicationId } });
  if (!row) throw new Error("Medication not found.");
  await prisma.currentMedication.update({ where: { medicationId }, data: { active: false } });
  revalidatePatient(row.patientId);
}

// ─── Phase 3: SOAP notes, vitals, referrals, recall call log ────────────────

export async function updateTreatmentSoap(formData: FormData) {
  await requireDentistId();
  const treatmentId = parseInt(formData.get("treatmentId") as string, 10);
  if (!treatmentId) throw new Error("Treatment ID required.");
  const soapSubjective = ((formData.get("soapSubjective") as string) || "").trim();
  const soapObjective  = ((formData.get("soapObjective")  as string) || "").trim();
  const soapAssessment = ((formData.get("soapAssessment") as string) || "").trim();
  const soapPlan       = ((formData.get("soapPlan")       as string) || "").trim();
  const vitalsBP       = ((formData.get("vitalsBP")       as string) || "").trim().slice(0, 10);
  const vitalsHRRaw    = (formData.get("vitalsHR") as string) || "";
  const vitalsHR       = vitalsHRRaw ? parseInt(vitalsHRRaw, 10) : null;

  const treatment = await prisma.treatment.update({
    where: { treatmentId },
    data: {
      soapSubjective: soapSubjective || null,
      soapObjective:  soapObjective  || null,
      soapAssessment: soapAssessment || null,
      soapPlan:       soapPlan       || null,
      vitalsBP:       vitalsBP       || null,
      vitalsHR:       vitalsHR && !Number.isNaN(vitalsHR) ? vitalsHR : null,
    },
    include: { appointment: true },
  });
  revalidatePath(`/dashboard/treatments/today`);
  revalidatePath(`/dashboard/patients/${treatment.appointment.pId}`);
}

export async function addReferral(formData: FormData) {
  const dentistId = await requireDentistId();
  const patientId     = parseInt(formData.get("patientId") as string, 10);
  const specialistType = ((formData.get("specialistType") as string) || "").trim().slice(0, 60);
  const reason         = ((formData.get("reason")         as string) || "").trim().slice(0, 300);
  const urgency        = ((formData.get("urgency")        as string) || "routine") as "routine" | "urgent" | "emergency";
  const notes          = ((formData.get("notes")          as string) || "").trim().slice(0, 500);
  if (!patientId || !specialistType || !reason) throw new Error("Specialist type and reason are required.");
  const allowed = ["routine","urgent","emergency"];
  await prisma.referral.create({
    data: {
      patientId,
      dentistId,
      specialistType,
      reason,
      urgency: allowed.includes(urgency) ? urgency : "routine",
      notes: notes || null,
    },
  });
  revalidatePatient(patientId);
}

export async function updateReferralStatus(formData: FormData) {
  await requireDentistId();
  const referralId = parseInt(formData.get("referralId") as string, 10);
  const status = formData.get("status") as "pending" | "sent" | "completed" | "cancelled";
  const allowed = ["pending","sent","completed","cancelled"];
  if (!referralId || !allowed.includes(status)) throw new Error("Invalid.");
  const row = await prisma.referral.update({ where: { referralId }, data: { status } });
  revalidatePatient(row.patientId);
}

export async function addRecallCallLog(formData: FormData) {
  const person = await requireClinicalEditor();
  const recallId = parseInt(formData.get("recallId") as string, 10);
  const outcome  = ((formData.get("outcome") as string) || "").trim().slice(0, 60);
  const notes    = ((formData.get("notes")   as string) || "").trim().slice(0, 300);
  if (!recallId || !outcome) throw new Error("Outcome required.");
  await prisma.recallCallLog.create({
    data: { recallId, calledById: person.personId, outcome, notes: notes || null },
  });
  revalidatePath("/dashboard/reception/recalls");
}
