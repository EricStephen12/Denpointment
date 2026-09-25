import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isAdmin, isReceptionist, isDentist } from "@/lib/auth";
import { getClinicDay } from "@/lib/clinic-date";

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

function fmtHour(h: number): string {
  const ampm = h >= 12 ? "PM" : "AM";
  const d = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${d}:00 ${ampm}`;
}

/**
 * GET /api/export/schedule?date=YYYY-MM-DD
 * Admin / receptionist / dentist. Exports the day's schedule as CSV.
 * If `date` is omitted, defaults to today.
 */
export async function GET(request: NextRequest) {
  const dbUser = await getCurrentPerson();
  if (!dbUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const canExport = isAdmin(dbUser) || isReceptionist(dbUser) || isDentist(dbUser);
  if (!canExport) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date");

  let year: number, month: number, day: number;
  if (dateParam) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateParam);
    if (!m) return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    year = +m[1]; month = +m[2]; day = +m[3];
  } else {
    const today = getClinicDay();
    year = today.year; month = today.month; day = today.day;
  }

  // Dentists only see their own schedule
  const dentistId = isDentist(dbUser) && !isAdmin(dbUser) && !isReceptionist(dbUser)
    ? dbUser.dentists[0].dentistId
    : undefined;

  const appointments = await prisma.appointment.findMany({
    where: {
      year, month, day,
      ...(dentistId ? { dId: dentistId } : {}),
    },
    include: {
      patient: {
        include: {
          person: { include: { contacts: true } },
        },
      },
      dentist: { include: { person: true } },
      treatments: true,
    },
    orderBy: { hour: "asc" },
  });

  const headers = [
    "Time",
    "Patient Name",
    "Patient Email",
    "Patient Phone",
    "Dentist",
    "Room",
    "Status",
    "Appointment Type",
    "Notes",
    "Procedure(s)",
    "Total Charge (₦)",
    "Confirmed",
    "Arrived",
    "No-show",
  ];

  const lines: string[] = [headers.join(",")];

  for (const app of appointments) {
    const person   = app.patient.person;
    const phone    = person.contacts[0]?.contactNumber ?? "";
    const dentist  = `Dr. ${app.dentist.person.firstName} ${app.dentist.person.lastName}`;
    const procs    = app.treatments.map((t) => t.action).join("; ");
    const charge   = app.treatments.reduce((s, t) => s + t.charge, 0);
    const confirmed = app.confirmedAt ? new Date(app.confirmedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
    const arrived   = app.arrivedAt   ? new Date(app.arrivedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

    lines.push(row([
      fmtHour(app.hour),
      `${person.firstName} ${person.lastName}`,
      person.email,
      phone,
      dentist,
      app.room,
      app.status.replace("_", " "),
      (app.type as string).replace("_", " "),
      app.notes,
      procs,
      charge > 0 ? String(charge) : "",
      confirmed,
      arrived,
      app.noShow ? "Yes" : "",
    ]));
  }

  const csv      = lines.join("\r\n");
  const dateStr  = `${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
  const filename = `schedule-${dateStr}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type":        "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control":       "no-store",
    },
  });
}
