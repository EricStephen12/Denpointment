import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isAdmin, isReceptionist } from "@/lib/auth";

function escapeCSV(val: string | null | undefined): string {
  if (val == null) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function row(fields: (string | null | undefined)[]): string {
  return fields.map(escapeCSV).join(",");
}

/**
 * GET /api/export/patients
 * Admin / receptionist only. Streams a CSV of all registered patients.
 */
export async function GET(_request: NextRequest) {
  const dbUser = await getCurrentPerson();
  if (!dbUser || (!isAdmin(dbUser) && !isReceptionist(dbUser))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const patients = await prisma.patient.findMany({
    include: {
      person: {
        include: {
          contacts: true,
          addresses: true,
          diseases: true,
        },
      },
      appointments: {
        orderBy: [{ year: "asc" }, { month: "asc" }, { day: "asc" }],
        take: 1,
      },
      currentMedications: { where: { active: true } },
      allergies: true,
      insurancePolicies: { where: { active: true }, take: 1 },
    },
    orderBy: { person: { lastName: "asc" } },
  });

  const headers = [
    "Patient ID",
    "First Name",
    "Last Name",
    "Gender",
    "Date of Birth",
    "Age",
    "Email",
    "Phone",
    "Street",
    "City",
    "Occupation",
    "Referral Source",
    "Emergency Contact Name",
    "Emergency Contact Phone",
    "Chronic Conditions",
    "Allergies",
    "Current Medications",
    "Insurance Provider",
    "Insurance Policy #",
    "First Visit Date",
    "Patient Since (Year)",
  ];

  const lines: string[] = [headers.join(",")];

  for (const p of patients) {
    const person  = p.person;
    const dob     = person.birthDate ? new Date(person.birthDate).toLocaleDateString() : "";
    const age     = person.birthDate
      ? Math.floor((Date.now() - new Date(person.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25)).toString()
      : "";
    const phone   = person.contacts.map((c) => c.contactNumber).join(" / ");
    const address = person.addresses[0];
    const street  = address?.street ?? "";
    const city    = address?.city   ?? "";
    const diseases = person.diseases.map((d) => d.chronicDisease).join("; ");
    const allergies = p.allergies.map((a) => `${a.name}${a.severity ? ` (${a.severity})` : ""}`).join("; ");
    const meds      = p.currentMedications.map((m) => `${m.name}${m.dose ? ` ${m.dose}` : ""}`).join("; ");
    const ins       = p.insurancePolicies[0];
    const firstAppt = p.appointments[0];
    const firstVisit = firstAppt ? `${firstAppt.day}/${firstAppt.month}/${firstAppt.year}` : "";
    const sinceYear  = firstAppt ? String(firstAppt.year) : "";

    lines.push(row([
      String(p.patientId),
      person.firstName,
      person.lastName,
      person.gender,
      dob,
      age,
      person.email,
      phone,
      street,
      city,
      person.occupation,
      person.referralSource,
      person.emergencyContactName,
      person.emergencyContactPhone,
      diseases,
      allergies,
      meds,
      ins?.provider,
      ins?.policyNumber,
      firstVisit,
      sinceYear,
    ]));
  }

  const csv = lines.join("\r\n");
  const filename = `patients-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type":        "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control":       "no-store",
    },
  });
}
