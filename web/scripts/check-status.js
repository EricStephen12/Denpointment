const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const persons = await prisma.person.findMany({
    include: { admins: true, dentists: true, receptionists: true, patients: true }
  });
  console.log(`=== DB STATUS: ${persons.length} Persons ===`);
  persons.forEach(p => {
    const roles = [];
    if (p.admins.length) roles.push('admin');
    if (p.dentists.length) roles.push('dentist');
    if (p.receptionists.length) roles.push('receptionist');
    if (p.patients.length) roles.push('patient');
    console.log(`- #${p.personId}: ${p.firstName} ${p.lastName} <${p.email}> | Roles: [${roles.join(', ')}] | HasPassword: ${!!p.password}`);
  });

  const appointments = await prisma.appointment.count();
  const dentists = await prisma.dentist.count();
  const services = await prisma.service.count();
  const settings = await prisma.clinicSettings.findFirst();
  const siteSettings = await prisma.siteSettings.findFirst();
  const autoSettings = await prisma.automationSettings.findFirst();

  console.log('\n=== STATS ===');
  console.log('Dentists available:', dentists);
  console.log('Appointments:', appointments);
  console.log('Services:', services);
  console.log('Clinic Hours:', settings ? `${settings.openHour}:00 - ${settings.closeHour}:00 (Days: ${settings.workingDays})` : 'None');
  console.log('Site Settings stored:', siteSettings ? `Name: ${siteSettings.clinicName}, Email: ${siteSettings.email}` : 'Defaults in use');
  console.log('Automation Settings:', autoSettings ? `Birthday: ${autoSettings.birthdayEnabled}, Anniversary: ${autoSettings.anniversaryEnabled}` : 'Defaults');
}

main().catch(console.error).finally(() => prisma.$disconnect());
