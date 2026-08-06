/**
 * Grant admin (+ optional dentist) to an existing person by email.
 * Usage: node scripts/bootstrap-staff.js you@email.com
 */
const { PrismaClient } = require("@prisma/client");

const email = (process.argv[2] || "").trim().toLowerCase();
if (!email) {
  console.error("Usage: node scripts/bootstrap-staff.js you@email.com");
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  const person = await prisma.person.findUnique({
    where: { email },
    include: { admins: true, dentists: true },
  });
  if (!person) {
    throw new Error(`No person found with email ${email}. Sign up / finish onboarding first.`);
  }

  if (person.admins.length === 0) {
    await prisma.admin.create({ data: { personId: person.personId } });
    console.log(`Granted ADMIN to ${email}`);
  } else {
    console.log(`${email} is already an admin.`);
  }

  // Also add dentist so booking slots exist (0 dentists = empty calendar).
  if (person.dentists.length === 0) {
    await prisma.dentist.create({
      data: { personId: person.personId, roomNumber: "1" },
    });
    console.log(`Granted DENTIST to ${email} (room 1) so patients can book.`);
  }

  await prisma.clinicSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      openHour: 8,
      closeHour: 18,
      workingDays: [1, 2, 3, 4, 5, 6],
    },
  });
  console.log("Clinic settings ready.");
  console.log("Done. Sign out/in or refresh /dashboard — you should see Admin tools.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
