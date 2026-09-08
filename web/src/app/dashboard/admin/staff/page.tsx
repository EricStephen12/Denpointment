import React from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isAdmin } from "@/lib/auth";
import StaffRoleManager, { type MemberItem } from "@/components/admin/StaffRoleManager";

export const metadata = {
  title: "Staff & Permissions — Glow Dental",
  description: "Assign roles, promote members to admin or dentists, and manage staff permissions.",
};

export default async function StaffManagementPage() {
  const dbUser = await getCurrentPerson();
  if (!dbUser) redirect("/");
  if (!isAdmin(dbUser)) redirect("/dashboard");

  const rawPersons = await prisma.person.findMany({
    include: {
      admins: true,
      dentists: true,
      receptionists: true,
      patients: true,
    },
    orderBy: [
      { admins: { _count: "desc" } },
      { dentists: { _count: "desc" } },
      { receptionists: { _count: "desc" } },
      { lastName: "asc" },
    ],
  });

  const members: MemberItem[] = rawPersons.map((p) => ({
    personId: p.personId,
    firstName: p.firstName,
    lastName: p.lastName,
    email: p.email,
    gender: p.gender,
    hasPassword: Boolean(p.password),
    isAdmin: p.admins.length > 0,
    isDentist: p.dentists.length > 0,
    dentistRoom: p.dentists[0]?.roomNumber ?? null,
    isReceptionist: p.receptionists.length > 0,
    isPatient: p.patients.length > 0,
  }));

  return (
    <div>
      <StaffRoleManager members={members} currentAdminId={dbUser.personId} />
    </div>
  );
}
