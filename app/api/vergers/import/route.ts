import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

function parseOuiNon(val: unknown): boolean {
  if (typeof val === "boolean") return val;
  if (typeof val === "string") return val.trim().toLowerCase() === "oui";
  return false;
}

function parseNum(val: unknown): number | null {
  if (val === null || val === undefined || val === "") return null;
  const n = parseFloat(String(val));
  return isNaN(n) ? null : n;
}

function parseIntVal(val: unknown): number | null {
  if (val === null || val === undefined || val === "") return null;
  const n = Math.round(Number(String(val)));
  return isNaN(n) ? null : n;
}

function str(val: unknown): string | null {
  if (val === null || val === undefined || val === "") return null;
  return String(val).trim() || null;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role: string })?.role;
  if (!session || role !== "ADMIN")
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });

  const buf = Buffer.from(await file.arrayBuffer());
  const wb = XLSX.read(buf, { type: "buffer" });

  // Onglet Verger
  const wsVerger = wb.Sheets["Verger"];
  if (!wsVerger) return NextResponse.json({ error: "Onglet 'Verger' introuvable dans le fichier" }, { status: 400 });

  const vergerRows = XLSX.utils.sheet_to_json<string[]>(wsVerger, { header: 1 }) as unknown[][];

  // Les données sont en colonne B (index 1), à partir de la ligne 2 (index 1)
  function getVal(label: string): unknown {
    const row = vergerRows.find((r) => String(r[0] ?? "").replace(" *", "").trim() === label.replace(" *", "").trim());
    return row ? row[1] : null;
  }

  const nom = str(getVal("Nom du verger"));
  if (!nom) return NextResponse.json({ error: "Le nom du verger est obligatoire" }, { status: 400 });

  // Onglet Arbres
  const wsArbres = wb.Sheets["Arbres"];
  if (!wsArbres) return NextResponse.json({ error: "Onglet 'Arbres' introuvable dans le fichier" }, { status: 400 });

  const arbresRows = XLSX.utils.sheet_to_json<unknown[]>(wsArbres, { header: 1 }) as unknown[][];
  // Ignorer la ligne d'en-tête (index 0)
  const arbres = arbresRows
    .slice(1)
    .filter((r) => str(r[0]))
    .map((r, i) => ({
      espece: str(r[0])!,
      nbArbres: parseIntVal(r[1]),
      varietes: str(r[2]),
      formes: str(r[3]),
      ageMoyen: parseIntVal(r[4]),
      ordre: i,
    }));

  const verger = await prisma.verger.create({
    data: {
      nom,
      proprietaire: str(getVal("Propriétaire")),
      exploitant: str(getVal("Exploitant")),
      adresse: str(getVal("Adresse")),
      codePostal: str(getVal("Code postal")),
      ville: str(getVal("Ville")),
      pays: str(getVal("Pays")) ?? "France",
      contact: str(getVal("Contact")),
      ouvertPublic: parseOuiNon(getVal("Ouvert au public")),
      superficie: parseNum(getVal("Superficie (m²)")),
      sol: str(getVal("Sol")),
      ph: parseNum(getVal("pH")),
      pluviometrie: parseNum(getVal("Pluviométrie annuelle (mm)")),
      moisDeficit: str(getVal("Mois de déficit hydrique")),
      anneeCreation: parseIntVal(getVal("Année de création")),
      anneeConversion: parseIntVal(getVal("Année de conversion en bio")),
      certifications: str(getVal("Certifications / Labels")),
      objectifs: str(getVal("Objectifs du verger")),
      personnelEmployes: str(getVal("Personnel employés")),
      personnelBenevoles: str(getVal("Bénévoles")),
      activitesFormation: str(getVal("Activités de formation")),
      autresActivites: str(getVal("Autres activités")),
      notes: str(getVal("Notes")),
      arbres: arbres.length ? { create: arbres } : undefined,
    },
  });

  return NextResponse.json({ ok: true, id: verger.id, nom: verger.nom });
}
