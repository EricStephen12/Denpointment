"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession, deleteSession } from "@/lib/session";

const rolesInclude = {
  admins: true,
  receptionists: true,
  dentists: true,
  patients: true,
  contacts: true,
  addresses: true,
} as const;

/**
 * Server Action: Authenticate user with Email and Password.
 */
export async function loginAction(formData: FormData) {
  const email = ((formData.get("email") as string) || "").trim().toLowerCase();
  const password = (formData.get("password") as string) || "";
  const redirectUrl = (formData.get("redirectUrl") as string) || "/dashboard";

  if (!email || !password) {
    return { error: "Please provide both email and password." };
  }

  const person = await prisma.person.findUnique({
    where: { email },
    include: rolesInclude,
  });

  if (!person || !person.password) {
    return { error: "Invalid email or password." };
  }

  const isMatch = await bcrypt.compare(password, person.password);
  if (!isMatch) {
    return { error: "Invalid email or password." };
  }

  let role = "patient";
  if (person.admins.length > 0) role = "admin";
  else if (person.dentists.length > 0) role = "dentist";
  else if (person.receptionists.length > 0) role = "receptionist";

  await createSession({
    personId: person.personId,
    email: person.email,
    name: `${person.firstName} ${person.lastName}`.trim(),
    role,
  });

  return { success: true, redirectUrl };
}

/**
 * Server Action: Register a new patient account with Name, Email, Password, & optional Phone.
 */
export async function signupAction(formData: FormData) {
  const firstName = ((formData.get("firstName") as string) || "").trim();
  const lastName = ((formData.get("lastName") as string) || "").trim();
  const email = ((formData.get("email") as string) || "").trim().toLowerCase();
  const password = (formData.get("password") as string) || "";
  const phone = ((formData.get("phone") as string) || "").trim();
  const redirectUrl = (formData.get("redirectUrl") as string) || "/dashboard";

  if (!firstName || !email || !password) {
    return { error: "First name, email, and password are required." };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters long." };
  }

  // Check if email already registered
  const existing = await prisma.person.findUnique({
    where: { email },
  });

  if (existing) {
    return {
      error: "An account with this email already exists. Please log in instead.",
    };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const created = await prisma.$transaction(async (tx) => {
      const person = await tx.person.create({
        data: {
          email,
          firstName,
          lastName: lastName || "",
          password: hashedPassword,
          gender: "male",
        },
      });

      await tx.patient.create({
        data: {
          personId: person.personId,
        },
      });

      if (phone) {
        await tx.personContactNumber.create({
          data: {
            personId: person.personId,
            contactNumber: phone.replace(/[^0-9+]/g, "").slice(0, 15),
          },
        });
      }

      return person;
    });

    await createSession({
      personId: created.personId,
      email: created.email,
      name: `${created.firstName} ${created.lastName}`.trim(),
      role: "patient",
    });

    return { success: true, redirectUrl };
  } catch (err) {
    console.error("Signup error:", err);
    return { error: "Failed to create your account. Please try again." };
  }
}

/**
 * Server Action: Logout and destroy session cookie.
 */
export async function logoutAction() {
  await deleteSession();
}

/**
 * Server Action: Request password reset link.
 */
export async function requestPasswordResetAction(formData: FormData) {
  const email = ((formData.get("email") as string) || "").trim().toLowerCase();
  const origin = ((formData.get("origin") as string) || "").trim();

  if (!email) {
    return { error: "Please enter your email address." };
  }

  const { isEmailConfigured } = await import("@/lib/email");
  if (!isEmailConfigured()) {
    return {
      error:
        "Email delivery is not configured yet. Please contact clinic reception directly to reset your credentials, or set a valid RESEND_API_KEY in .env.",
    };
  }

  const person = await prisma.person.findUnique({
    where: { email },
  });

  if (person) {
    const { createPasswordResetToken } = await import("@/lib/session");
    const { sendPasswordResetEmail } = await import("@/lib/email");

    const token = await createPasswordResetToken(person.email, person.personId);
    const baseUrl = origin || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(token)}`;

    // Log to server console for testing
    console.info(`[auth] Password reset link for ${person.email}: ${resetUrl}`);

    const result = await sendPasswordResetEmail({
      to: person.email,
      resetUrl,
      name: person.firstName,
    });

    if (!result.sent) {
      return {
        error:
          "Unable to send reset email. Please contact clinic reception or check your RESEND_API_KEY.",
      };
    }
  }

  return {
    success: true,
    message: "If an account exists with this email, a password reset link has been sent.",
  };
}

/**
 * Server Action: Complete password reset with new password.
 */
export async function resetPasswordAction(formData: FormData) {
  const token = (formData.get("token") as string) || "";
  const password = (formData.get("password") as string) || "";
  const confirmPassword = (formData.get("confirmPassword") as string) || "";

  if (!token) {
    return { error: "Invalid or missing reset token." };
  }

  if (!password || !confirmPassword) {
    return { error: "Please provide and confirm your new password." };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters long." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const { verifyPasswordResetToken } = await import("@/lib/session");
  const verified = await verifyPasswordResetToken(token);

  if (!verified) {
    return {
      error: "This password reset link has expired or is invalid. Please request a new one.",
    };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const updatedPerson = await prisma.person.update({
    where: { personId: verified.personId },
    data: { password: hashedPassword },
    include: rolesInclude,
  });

  let role = "patient";
  if (updatedPerson.admins.length > 0) role = "admin";
  else if (updatedPerson.dentists.length > 0) role = "dentist";
  else if (updatedPerson.receptionists.length > 0) role = "receptionist";

  // Automatically sign the user into their account
  await createSession({
    personId: updatedPerson.personId,
    email: updatedPerson.email,
    name: `${updatedPerson.firstName} ${updatedPerson.lastName}`.trim(),
    role,
  });

  return { success: true, redirectUrl: "/dashboard" };
}

