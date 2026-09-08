import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import type {
  Admin,
  Address,
  ChronicDisease,
  Dentist,
  Patient,
  Person,
  PersonContactNumber,
  Receptionist,
} from "@prisma/client";

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
  contacts: true,
  addresses: true,
} as const;

/**
 * Resolves the currently signed-in user via encrypted HTTP-only session cookie.
 * Wrapped in React.cache() so all layout, pages, and components in the request
 * share a single database query.
 */
export const getCurrentPerson = cache(
  async (): Promise<PersonWithRoles | null> => {
    const session = await getSession();
    if (!session || !session.personId) return null;

    try {
      const person = await prisma.person.findUnique({
        where: { personId: session.personId },
        include: rolesInclude,
      });

      return person;
    } catch (err) {
      console.error("getCurrentPerson error:", err);
      return null;
    }
  }
);

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

// Re-export actions from dedicated 'use server' file
export { loginAction, signupAction, logoutAction } from "@/app/actions/auth";
