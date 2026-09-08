"use server";

import { revalidatePath } from "next/cache";
import { Prisma, Gender } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isAdmin } from "@/lib/auth";

async function requireAdmin() {
  const person = await getCurrentPerson();
  if (!person || !isAdmin(person)) {
    throw new Error("You're not authorized to manage staff.");
  }
  return person;
}

/**
 * Assign or promote a member (existing patient or new person) to a clinic role.
 * If the email is already in the system, it upgrades their permissions in-place.
 * If not, it pre-provisions their person record so they can activate upon sign-up.
 */
export async function assignOrPromoteMember(formData: FormData) {
  await requireAdmin();

  const email = ((formData.get("email") as string) || "").trim().toLowerCase();
  const role = (formData.get("role") as string) || "";
  const roomNumber = ((formData.get("roomNumber") as string) || "").trim() || "1";
  const firstName = ((formData.get("firstName") as string) || "").trim();
  const lastName = ((formData.get("lastName") as string) || "").trim();
  const gender = ((formData.get("gender") as string) || "female") as Gender;

  if (!email) {
    return { error: "Email is required." };
  }
  if (!["admin", "dentist", "receptionist"].includes(role)) {
    return { error: "Please select a valid role (Admin, Dentist, or Receptionist)." };
  }

  try {
    const existing = await prisma.person.findUnique({
      where: { email },
      include: { admins: true, dentists: true, receptionists: true, patients: true },
    });

    if (existing) {
      // Existing member / patient: promote to the selected role!
      if (role === "admin") {
        if (!existing.admins.length) {
          await prisma.admin.create({ data: { personId: existing.personId } });
        }
      } else if (role === "dentist") {
        await prisma.dentist.upsert({
          where: { personId: existing.personId },
          create: { personId: existing.personId, roomNumber },
          update: { roomNumber },
        });
      } else if (role === "receptionist") {
        if (!existing.receptionists.length) {
          await prisma.receptionist.create({ data: { personId: existing.personId } });
        }
      }

      revalidatePath("/dashboard/admin/staff");
      return {
        success: true,
        message: `Successfully granted ${role.toUpperCase()} role to ${existing.firstName} ${existing.lastName} (${email}).`,
      };
    }

    // New member: require at least a first name
    if (!firstName) {
      return {
        error: "This email is not yet registered. Please provide at least a First Name to invite them.",
      };
    }

    const person = await prisma.person.create({
      data: {
        email,
        firstName,
        lastName: lastName || "",
        gender: gender === "male" || gender === "female" ? gender : "female",
      },
    });

    if (role === "dentist") {
      await prisma.dentist.create({ data: { personId: person.personId, roomNumber } });
    } else if (role === "receptionist") {
      await prisma.receptionist.create({ data: { personId: person.personId } });
    } else {
      await prisma.admin.create({ data: { personId: person.personId } });
    }

    revalidatePath("/dashboard/admin/staff");
    return {
      success: true,
      message: `Pre-provisioned new staff member ${firstName} ${lastName} (${email}) as ${role.toUpperCase()}. They can now sign up to activate.`,
    };
  } catch (error: any) {
    console.error("[staff] assignOrPromoteMember error:", error);
    return { error: error?.message || "Failed to assign role." };
  }
}

/**
 * Toggle a specific role (Admin, Dentist, Receptionist) on an existing member.
 */
export async function toggleMemberRole(formData: FormData) {
  const currentAdmin = await requireAdmin();

  const personId = parseInt(formData.get("personId") as string, 10);
  const role = formData.get("role") as string;
  const enabled = formData.get("enabled") === "true";
  const roomNumber = ((formData.get("roomNumber") as string) || "").trim() || "1";

  if (!personId || !["admin", "dentist", "receptionist"].includes(role)) {
    return { error: "Invalid role toggle request." };
  }

  // Prevent accidental lockout: admin cannot remove their own admin privileges
  if (personId === currentAdmin.personId && role === "admin" && !enabled) {
    return { error: "You cannot revoke your own Admin role." };
  }

  try {
    if (enabled) {
      if (role === "admin") {
        await prisma.admin.upsert({
          where: { personId },
          create: { personId },
          update: {},
        });
      } else if (role === "dentist") {
        await prisma.dentist.upsert({
          where: { personId },
          create: { personId, roomNumber },
          update: { roomNumber },
        });
      } else if (role === "receptionist") {
        await prisma.receptionist.upsert({
          where: { personId },
          create: { personId },
          update: {},
        });
      }
    } else {
      if (role === "admin") {
        await prisma.admin.deleteMany({ where: { personId } });
      } else if (role === "dentist") {
        await prisma.dentist.deleteMany({ where: { personId } });
      } else if (role === "receptionist") {
        await prisma.receptionist.deleteMany({ where: { personId } });
      }
    }

    revalidatePath("/dashboard/admin/staff");
    return { success: true };
  } catch (error: any) {
    console.error("[staff] toggleMemberRole error:", error);
    return { error: error?.message || "Failed to update role." };
  }
}

/**
 * Update the consultation room number for a dentist.
 */
export async function updateDentistRoom(formData: FormData) {
  await requireAdmin();

  const personId = parseInt(formData.get("personId") as string, 10);
  const roomNumber = ((formData.get("roomNumber") as string) || "").trim();

  if (!personId || !roomNumber) {
    return { error: "Person ID and Room Number are required." };
  }

  try {
    await prisma.dentist.update({
      where: { personId },
      data: { roomNumber },
    });
    revalidatePath("/dashboard/admin/staff");
    return { success: true };
  } catch (error: any) {
    return { error: error?.message || "Failed to update room number." };
  }
}

/**
 * Revoke all staff privileges (Admin, Dentist, Receptionist) from a member,
 * preserving their person and patient history so appointments are not damaged.
 */
export async function revokeStaffRoles(formData: FormData) {
  const currentAdmin = await requireAdmin();
  const personId = parseInt(formData.get("personId") as string, 10);

  if (!personId) return { error: "Missing person." };

  if (personId === currentAdmin.personId) {
    return { error: "You cannot remove your own staff access." };
  }

  try {
    await prisma.$transaction([
      prisma.admin.deleteMany({ where: { personId } }),
      prisma.dentist.deleteMany({ where: { personId } }),
      prisma.receptionist.deleteMany({ where: { personId } }),
    ]);

    revalidatePath("/dashboard/admin/staff");
    return { success: true };
  } catch (error: any) {
    console.error("[staff] revokeStaffRoles error:", error);
    return { error: error?.message || "Failed to revoke staff roles." };
  }
}

/**
 * Legacy wrapper: create staff member from scratch (supports existing emails as promotion).
 */
export async function createStaffMember(formData: FormData) {
  await assignOrPromoteMember(formData);
  revalidatePath("/dashboard/admin/staff");
}

/**
 * Remove a staff member or delete unneeded test profile.
 */
export async function removeStaffMember(formData: FormData) {
  const currentAdmin = await requireAdmin();

  const personId = parseInt(formData.get("personId") as string, 10);
  if (!personId) throw new Error("Missing person.");

  if (personId === currentAdmin.personId) {
    throw new Error("You cannot remove your own account.");
  }

  try {
    // Check if person has clinical appointments
    const appointmentCount = await prisma.appointment.count({
      where: {
        OR: [
          { patient: { personId } },
          { dentist: { personId } },
        ],
      },
    });

    if (appointmentCount > 0) {
      // Safely revoke staff roles without deleting historical clinical records
      await prisma.$transaction([
        prisma.admin.deleteMany({ where: { personId } }),
        prisma.dentist.deleteMany({ where: { personId } }),
        prisma.receptionist.deleteMany({ where: { personId } }),
      ]);
    } else {
      // Safe to completely delete
      await prisma.person.delete({ where: { personId } });
    }

    revalidatePath("/dashboard/admin/staff");
  } catch (error: any) {
    console.error("[staff] removeStaffMember error:", error);
    throw error;
  }
}
