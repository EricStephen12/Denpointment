import { prisma } from './src/lib/prisma';

async function main() {
  try {
    console.log("Checking clinicSettings...");
    const s = await prisma.clinicSettings.findUnique({ where: { id: 1 } });
    console.log("ClinicSettings result:", s);

    console.log("Checking services...");
    const srv = await prisma.service.findMany();
    console.log("Services count:", srv.length);
  } catch (err) {
    console.error("Query failed with error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
