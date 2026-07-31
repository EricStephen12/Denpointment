import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { Admin, Address, ChronicDisease, Dentist, Patient, Person, PersonContactNumber, Receptionist } from "@prisma/client";

export type PersonWithRoles = Person & {
  admins: Admin[];
  receptionists: Receptionist[];
  dentists: Dentist[];
  patients: Patient[];
  addresses?: Address[];
  contacts?: PersonContactNumber[];
  diseases?: ChronicDisease[];
};

const rolesInclude = {
  admins: true,
  receptionists: true,
  dentists: true,
  patients: true,
} as const;

/**
 * Resolves the currently signed-in Clerk user to our internal Person record
 * (including their role rows). Returns null if the visitor isn't signed in,
 * or if they're signed in but haven't completed onboarding yet.
 *
 * If a staff member was pre-provisioned by an admin (a Person row exists
 * with a matching email but no clerkId yet), this links the account on
 * first login instead of treating them as a new patient.
 */
export async function getCurrentPerson(): Promise<PersonWithRoles | null> {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const existing = await prisma.person.findUnique({
    where: { clerkId: clerkUser.id },
    include: rolesInclude,
  });
  if (existing) return existing;

  const email = clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) return null;

  const pending = await prisma.person.findUnique({
    where: { email },
    include: rolesInclude,
  });

  if (pending && !pending.clerkId) {
    return prisma.person.update({
      where: { personId: pending.personId },
      data: { clerkId: clerkUser.id },
      include: rolesInclude,
    });
  }

  return null;
}

export function isAdmin(person: PersonWithRoles | null) {
  return !!person && person.admins.length > 0;
}

export function isReceptionist(person: PersonWithRoles | null) {
  return !!person && person.receptionists.length > 0;
}

export function isDentist(person: PersonWithRoles | null) {
  return !!person && person.dentists.length > 0;
}

export function isPatient(person: PersonWithRoles | null) {
  return !!person && person.patients.length > 0;
}
