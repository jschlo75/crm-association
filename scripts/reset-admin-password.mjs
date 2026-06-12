// Usage: node --env-file=.env scripts/reset-admin-password.mjs
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const EMAIL = "admin@association.fr";
const NEW_PASSWORD = "Admin2026!";

async function main() {
  const hash = await bcrypt.hash(NEW_PASSWORD, 12);
  const user = await prisma.user.update({
    where: { email: EMAIL },
    data: { password: hash },
  });
  console.log(`✅ Mot de passe réinitialisé pour : ${user.email}`);
  console.log(`   Nouveau mot de passe : ${NEW_PASSWORD}`);
  console.log(`   (Changez-le depuis Mon profil après connexion)`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
