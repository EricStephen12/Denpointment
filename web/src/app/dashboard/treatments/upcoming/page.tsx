import React from 'react';
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isDentist } from "@/lib/auth";
import { CalendarClock } from 'lucide-react';

export default async function UpcomingAppointmentsPage() {
  const dbUser = await getCurrentPerson();
  if (!dbUser) redirect("/");
  if (!isDentist(dbUser)) redirect("/dashboard");

  const dentistId = dbUser.dentists[0].dentistId;
  const now = new Date();

  const appointments = await prisma.appointment.findMany({
    where: { dId: dentistId },
    include: { patient: { include: { person: true } } },
    orderBy: [{ year: 'asc' }, { month: 'asc' }, { day: 'asc' }, { hour: 'asc' }],
  });

  const upcoming = appointments.filter((app) => {
    const d = new Date(app.year, app.month - 1, app.day, app.hour);
    return d >= now;
  });

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="dash-icon-badge">
          <CalendarClock className="h-5 w-5 text-turq-400" />
        </div>
        <div>
          <h1 className="dash-title font-display">Upcoming Appointments</h1>
          <p className="dash-body mt-0.5">All future visits on your calendar.</p>
        </div>
      </div>

      <div className="dash-table-wrap">
        <table className="dash-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Room</th>
              <th>Date &amp; Time</th>
            </tr>
          </thead>
          <tbody>
            {upcoming.length > 0 ? upcoming.map((app) => (
              <tr key={app.appointmentId}>
                <td className="td-primary">{app.patient.person.firstName} {app.patient.person.lastName}</td>
                <td>{app.room}</td>
                <td>{app.hour}:00 — {app.day}/{app.month}/{app.year}</td>
              </tr>
            )) : (
              <tr><td colSpan={3} className="td-empty">No upcoming appointments.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
