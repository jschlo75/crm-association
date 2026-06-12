import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const users = await prisma.user.findMany({ select: { id: true, email: true, organisationId: true } });

let updated = 0;
let skipped = 0;

for (const user of users) {
  const contact = await prisma.contact.findFirst({
    where: { email: user.email },
    select: { organisationId: true },
  });

  if (!contact || !contact.organisationId) {
    console.log("⏭  Pas de contact/organisation pour :", user.email);
    skipped++;
    continue;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { organisationId: contact.organisationId },
  });

  console.log("✓ Mis à jour :", user.email, "→ organisationId", contact.organisationId);
  updated++;
}

console.log(`\nTerminé : ${updated} mis à jour, ${skipped} ignorés.`);
await prisma.$disconnect();
