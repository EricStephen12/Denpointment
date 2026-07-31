import React from 'react';
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isAdmin } from "@/lib/auth";
import { createStaffMember, removeStaffMember } from "@/app/actions/admin";
import { Users, Plus, Trash2, Stethoscope, Headset, ShieldCheck } from 'lucide-react';

export default async function StaffManagementPage() {
  const dbUser = await getCurrentPerson();
  if (!dbUser) redirect("/");
  if (!isAdmin(dbUser)) redirect("/dashboard");

  const staff = await prisma.person.findMany({
    where: {
      OR: [
        { dentists: { some: {} } },
        { receptionists: { some: {} } },
        { admins: { some: {} } },
      ],
    },
    include: { dentists: true, receptionists: true, admins: true },
    orderBy: { lastName: 'asc' },
  });

  const roleLabel = (p: typeof staff[number]) => {
    if (p.dentists.length > 0) return `Dentist — Room ${p.dentists[0].roomNumber}`;
    if (p.receptionists.length > 0) return "Receptionist";
    if (p.admins.length > 0) return "Admin";
    return "Unknown";
  };

  const roleIcon = (p: typeof staff[number]) => {
    if (p.dentists.length > 0) return <Stethoscope className="h-4 w-4 text-turq-400" />;
    if (p.receptionists.length > 0) return <Headset className="h-4 w-4 text-turq-400" />;
    return <ShieldCheck className="h-4 w-4 text-purple-400" />;
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div className="dash-icon-badge">
          <Users className="h-5 w-5 text-turq-400" />
        </div>
        <div>
          <h1 className="dash-title font-display">Staff Management</h1>
          <p className="dash-body mt-0.5">Add dentists, receptionists, and admins to the clinic.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Add staff form */}
        <div className="lg:col-span-2">
          <div className="dash-surface p-5">
            <h2 className="text-sm font-semibold text-sand-50 mb-4 flex items-center gap-2">
              <Plus className="h-4 w-4" /> Add Staff Member
            </h2>
            <form action={createStaffMember} className="space-y-3">
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
                <input type="email" id="email" name="email" required placeholder="staff@example.com" className="dash-input" />
                <p className="mt-1 text-[11px] text-sand-50/30">They must sign up with this exact email to get access.</p>
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
                  <label htmlFor="role" className="block text-xs font-medium text-sand-50/50 mb-1">Role</label>
                  <select id="role" name="role" required className="dash-input">
                    <option value="">Select</option>
                    <option value="dentist">Dentist</option>
                    <option value="receptionist">Receptionist</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="roomNumber" className="block text-xs font-medium text-sand-50/50 mb-1">Room Number (dentists only)</label>
                <input type="text" id="roomNumber" name="roomNumber" placeholder="e.g. A1" className="dash-input" />
              </div>
              <button type="submit"
                className="w-full bg-turq-600 text-ink-950 py-2.5 px-4 rounded-lg font-semibold text-sm hover:bg-turq-500 transition-colors">
                Add Staff Member
              </button>
            </form>
          </div>
        </div>

        {/* Staff list */}
        <div className="lg:col-span-3">
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {staff.length > 0 ? staff.map((p) => (
                  <tr key={p.personId}>
                    <td className="td-primary">{p.firstName} {p.lastName}</td>
                    <td>{p.email}</td>
                    <td>
                      <span className="inline-flex items-center gap-1.5">{roleIcon(p)} {roleLabel(p)}</span>
                    </td>
                    <td>
                      {p.clerkId ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-turq-600/20 text-turq-300">Active</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-900/40 text-amber-400">Pending sign-up</span>
                      )}
                    </td>
                    <td className="text-right">
                      <form action={removeStaffMember}>
                        <input type="hidden" name="personId" value={p.personId} />
                        <button type="submit" className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-300 font-medium">
                          <Trash2 className="h-3 w-3" /> Remove
                        </button>
                      </form>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="td-empty">No staff members yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
