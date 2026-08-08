import React from 'react';
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isAdmin, isReceptionist, isDentist } from "@/lib/auth";
import { registerWalkInPatient } from "@/app/actions/patients";
import { Search, UserPlus, Calendar } from 'lucide-react';

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const dbUser = await getCurrentPerson();
  if (!dbUser) redirect("/");
  if (!isAdmin(dbUser) && !isReceptionist(dbUser) && !isDentist(dbUser)) redirect("/dashboard");

  const canRegister = isAdmin(dbUser) || isReceptionist(dbUser);

  const { q } = await searchParams;
  const query = (q || "").trim();

  const patients = query
    ? await prisma.patient.findMany({
        where: {
          person: {
            OR: [
              { firstName: { contains: query, mode: 'insensitive' } },
              { lastName: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
              { contacts: { some: { contactNumber: { contains: query } } } },
            ],
          },
        },
        include: { person: { include: { contacts: true } } },
        take: 25,
      })
    : [];

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div className="dash-icon-badge">
          <Search className="h-5 w-5 text-turq-400" />
        </div>
        <div>
          <h1 className="dash-title font-display">Patients</h1>
          <p className="dash-body mt-0.5">
            Search a patient, open their profile — the <span className="text-turq-300">2D dental chart</span> is at the bottom of that page.
          </p>
        </div>
      </div>

      <div className={`grid grid-cols-1 ${canRegister ? "lg:grid-cols-5" : ""} gap-8`}>
        <div className={canRegister ? "lg:col-span-3" : ""}>
          <form className="flex gap-3 mb-6" method="get">
            <input type="text" name="q" defaultValue={query} placeholder="Search by name, email, or phone…"
              className="dash-input flex-1" />
            <button type="submit" className="bg-turq-600 text-ink-950 py-2 px-4 rounded-lg font-semibold text-sm hover:bg-turq-500 transition-colors shrink-0">
              Search
            </button>
          </form>

          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {query && patients.length === 0 && (
                  <tr><td colSpan={4} className="td-empty">No patients found.</td></tr>
                )}
                {!query && (
                  <tr><td colSpan={4} className="td-empty">Type a name, email, or phone number to search.</td></tr>
                )}
                {patients.map((p) => (
                  <tr key={p.patientId}>
                    <td className="td-primary">
                    <Link href={`/dashboard/patients/${p.patientId}`} className="hover:text-turq-400 transition-colors">
                      {p.person.firstName} {p.person.lastName}
                    </Link>
                  </td>
                  <td>{p.person.email}</td>
                  <td>{p.person.contacts[0]?.contactNumber || "—"}</td>
                    <td className="text-right space-x-3">
                    <Link href={`/dashboard/patients/${p.patientId}`} className="inline-flex items-center gap-1 text-xs text-sand-50/50 hover:text-turq-400 font-medium">
                      Profile
                    </Link>
                    {canRegister && (
                      <Link href={`/dashboard/book?patientId=${p.patientId}`} className="inline-flex items-center gap-1 text-xs text-turq-400 hover:text-turq-300 font-medium">
                        <Calendar className="h-3 w-3" /> Book
                      </Link>
                    )}
                  </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {canRegister && (
        <div className="lg:col-span-2">
          <div className="dash-surface p-5">
            <h2 className="text-sm font-semibold text-sand-50 mb-4 flex items-center gap-2">
              <UserPlus className="h-4 w-4" /> Register Walk-in / Phone Patient
            </h2>
            <form action={registerWalkInPatient} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="firstName" className="block text-xs font-medium text-sand-50/50 mb-1">First Name</label>
                  <input type="text" id="firstName" name="firstName" required className="dash-input" />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-xs font-medium text-sand-50/50 mb-1">Last Name</label>
                  <input type="text" id="lastName" name="lastName" required className="dash-input" />
                </div>
              </div>
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-sand-50/50 mb-1">Email</label>
                <input type="email" id="email" name="email" required className="dash-input" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="gender" className="block text-xs font-medium text-sand-50/50 mb-1">Gender</label>
                  <select id="gender" name="gender" required className="dash-input">
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="phone" className="block text-xs font-medium text-sand-50/50 mb-1">Phone (optional)</label>
                  <input type="tel" id="phone" name="phone" className="dash-input" />
                </div>
              </div>
              <button type="submit"
                className="w-full bg-turq-600 text-ink-950 py-2.5 px-4 rounded-lg font-semibold text-sm hover:bg-turq-500 transition-colors">
                Register &amp; Book Appointment
              </button>
            </form>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
