import { Gender, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_SERVICES } from "../src/lib/constants";

const prisma = new PrismaClient();

/**
 * Bootstraps the first admin account (and clinic defaults).
 *
 * Usage:
 *   npx tsx prisma/seed.ts
 * Or customize via env vars:
 *   SEED_ADMIN_EMAIL=you@example.com SEED_ADMIN_PASSWORD=YourPassword123! npx tsx prisma/seed.ts
 */
async function main() {
  const email = (process.env.SEED_ADMIN_EMAIL || "admin@glowdental.com").trim().toLowerCase();
  const rawPassword = process.env.SEED_ADMIN_PASSWORD || "Admin123!";
  const firstName = (process.env.SEED_ADMIN_FIRST || "Clinic").trim();
  const lastName = (process.env.SEED_ADMIN_LAST || "Admin").trim();

  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  const existing = await prisma.person.findUnique({
    where: { email },
    include: { admins: true },
  });

  if (existing) {
    await prisma.person.update({
      where: { personId: existing.personId },
      data: {
        password: hashedPassword,
      },
    });

    if (!existing.admins.length) {
      await prisma.admin.create({ data: { personId: existing.personId } });
      console.log(`Granted admin role and updated password for existing person ${email}.`);
    } else {
      console.log(`Updated password for existing admin ${email}.`);
    }
  } else {
    const person = await prisma.person.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        gender: Gender.female,
        admins: { create: {} },
      },
    });
    console.log(`Created admin person #${person.personId} for ${email} with password.`);
  }

  await prisma.clinicSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, openHour: 8, closeHour: 18, workingDays: [1, 2, 3, 4, 5, 6] },
  });

  for (const service of DEFAULT_SERVICES) {
    const existing = await prisma.service.findFirst({ where: { name: service.name } });
    if (!existing) {
      await prisma.service.create({ data: { name: service.name, price: service.price } });
      console.log(`Added service: ${service.name} (${service.price})`);
    } else if (existing.price !== service.price) {
      await prisma.service.update({
        where: { serviceId: existing.serviceId },
        data: { price: service.price },
      });
      console.log(`Updated service price: ${service.name} -> ${service.price}`);
    }
  }

  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
