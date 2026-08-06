const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function main() {
  const dentists = await p.dentist.findMany({
    include: { person: { select: { firstName: true, lastName: true, email: true } } },
  });
  const settings = await p.clinicSettings.findUnique({ where: { id: 1 } });
  const patients = await p.patient.count();
  console.log(
    JSON.stringify(
      {
        dentistCount: dentists.length,
        dentists: dentists.map((d) => ({
          id: d.dentistId,
          room: d.roomNumber,
          name: `${d.person.firstName} ${d.person.lastName}`,
          email: d.person.email,
        })),
        patientCount: patients,
        settings,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => p.$disconnect());
