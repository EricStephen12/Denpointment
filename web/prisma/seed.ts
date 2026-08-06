import { Gender, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Bootstraps the first admin account (and optional clinic defaults).
 *
 * Usage:
 *   SEED_ADMIN_EMAIL=you@example.com SEED_ADMIN_FIRST=Ada SEED_ADMIN_LAST=Admin npx prisma db seed
 *
 * After seeding, sign up / sign in with Clerk using that same email —
 * getCurrentPerson() will link the Clerk user to this admin row.
 */
async function main() {
  const email = (process.env.SEED_ADMIN_EMAIL || "").trim().toLowerCase();
  if (!email) {
    throw new Error(
      "Set SEED_ADMIN_EMAIL to the email you'll use with Clerk (e.g. SEED_ADMIN_EMAIL=you@clinic.com).",
    );
  }

  const firstName = (process.env.SEED_ADMIN_FIRST || "Clinic").trim();
  const lastName = (process.env.SEED_ADMIN_LAST || "Admin").trim();

  const existing = await prisma.person.findUnique({
    where: { email },
    include: { admins: true },
  });

  if (existing?.admins.length) {
    console.log(`Admin already exists for ${email} — nothing to do.`);
  } else if (existing) {
    await prisma.admin.create({ data: { personId: existing.personId } });
    console.log(`Granted admin role to existing person ${email}.`);
  } else {
    const person = await prisma.person.create({
      data: {
        email,
        firstName,
        lastName,
        gender: Gender.female,
        admins: { create: {} },
      },
    });
    console.log(`Created admin person #${person.personId} for ${email}.`);
  }

  await prisma.clinicSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, openHour: 8, closeHour: 18, workingDays: [1, 2, 3, 4, 5, 6] },
  });

  const serviceCount = await prisma.service.count();
  if (serviceCount === 0) {
    await prisma.service.createMany({
      data: [
        { name: "Consultation", price: 10000 },
        { name: "Cleaning", price: 25000 },
        { name: "Whitening", price: 65000 },
      ],
    });
    console.log("Seeded default services.");
  }

  console.log("Seed complete. Sign in with Clerk using that email to activate the admin account.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
