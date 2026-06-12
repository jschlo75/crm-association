import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const users = [
  { nom: "Jp schlosser",       email: "jschlo@yahoo.fr",                 password: "motdepasse2026!", role: "RESTREINT" },
  { nom: "Jp schlosser klint", email: "jschlosser@klint-consulting.com", password: "motdepasse2027!", role: "RESTREINT" },
];

for (const u of users) {
  const existing = await prisma.user.findUnique({ where: { email: u.email } });
  if (existing) {
    console.log("Existe déjà :", u.email);
    continue;
  }
  const hash = await bcrypt.hash(u.password, 12);
  const created = await prisma.user.create({
    data: { nom: u.nom, email: u.email, password: hash, role: u.role },
  });
  console.log("✓ Créé :", created.email, "-", created.role);
}

await prisma.$disconnect();
