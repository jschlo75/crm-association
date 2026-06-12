import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { readFileSync } from "fs";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = "Bienvenue2026!";

const wb = XLSX.readFile("C:/ClaudeCode/data/contacts_2026-05-17_MDP.xlsx");
const ws = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(ws);

console.log(`→ ${rows.length} utilisateurs à traiter\n`);

let created = 0;
let skipped = 0;

for (const row of rows) {
  const nom   = String(row["Nom complet"] || "").trim();
  const email = String(row["Email"] || "").trim().toLowerCase();
  const acces = String(row["Acces"] || "RESTREINT").trim().toUpperCase();
  const role  = acces === "ADMIN" ? "ADMIN" : acces === "MEMBRE" ? "MEMBRE" : "RESTREINT";

  if (!email) { console.log("⚠ Ligne ignorée (pas d'email):", nom); skipped++; continue; }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("= Existe déjà :", email);
    skipped++;
    continue;
  }

  const hash = await bcrypt.hash(DEFAULT_PASSWORD, 12);
  const user = await prisma.user.create({
    data: { nom, email, password: hash, role },
  });
  console.log(`✓ Créé : ${user.nom} <${user.email}> [${user.role}]`);
  created++;
}

console.log(`\n✅ Terminé : ${created} créé(s), ${skipped} ignoré(s).`);
console.log(`   Mot de passe par défaut : ${DEFAULT_PASSWORD}`);

await prisma.$disconnect();
