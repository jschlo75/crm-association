import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("Admin1234!", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@association.fr" },
    update: {},
    create: {
      nom: "Administrateur",
      email: "admin@association.fr",
      password,
      role: "ADMIN",
    },
  });

  console.log("Utilisateur admin créé :", admin.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
