import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import * as XLSX from "xlsx";

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role: string })?.role;
  if (!session || role !== "ADMIN")
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const wb = XLSX.utils.book_new();

  // Onglet 1 — Informations du verger
  const vergerData = [
    ["Champ", "Valeur", "Instructions"],
    ["Nom du verger *", "", "Obligatoire"],
    ["Propriétaire", "", ""],
    ["Exploitant", "", ""],
    ["Adresse", "", "Rue, lieu-dit..."],
    ["Code postal", "", ""],
    ["Ville", "", ""],
    ["Pays", "France", ""],
    ["Contact", "", "Nom, email, téléphone"],
    ["Ouvert au public", "Non", "Saisir Oui ou Non"],
    ["Superficie (m²)", "", "Nombre"],
    ["Sol", "", "Ex: Argileux, limoneux..."],
    ["pH", "", "Nombre décimal, ex: 6.5"],
    ["Pluviométrie annuelle (mm)", "", "Nombre"],
    ["Mois de déficit hydrique", "", "Ex: Juillet, Août"],
    ["Année de création", "", "Ex: 1985"],
    ["Année de conversion en bio", "", "Ex: 2010"],
    ["Certifications / Labels", "", "Ex: AB, HVE, Label Rouge..."],
    ["Objectifs du verger", "", "Ex: Production, conservatoire, pédagogique..."],
    ["Personnel employés", "", "Ex: 2 personnes, 1.5 ETP"],
    ["Bénévoles", "", "Ex: 5 bénévoles, 0.5 ETP"],
    ["Activités de formation", "", "Nature, périodicité, dates"],
    ["Autres activités", "", ""],
    ["Notes", "", "Observations libres"],
  ];

  const wsVerger = XLSX.utils.aoa_to_sheet(vergerData);
  wsVerger["!cols"] = [{ wch: 30 }, { wch: 40 }, { wch: 35 }];

  // Style header
  wsVerger["A1"] = { v: "Champ", t: "s" };
  wsVerger["B1"] = { v: "Valeur", t: "s" };
  wsVerger["C1"] = { v: "Instructions", t: "s" };

  XLSX.utils.book_append_sheet(wb, wsVerger, "Verger");

  // Onglet 2 — Arbres
  const arbresData = [
    ["Espèce *", "Nombre d'arbres", "Variétés", "Formes de conduite", "Âge moyen (ans)"],
    ["Poiriers", "", "", "", ""],
    ["Pommiers", "", "", "", ""],
    ["Pêchers", "", "", "", ""],
    ["Pruniers", "", "", "", ""],
    ["Abricotiers", "", "", "", ""],
    ["Vigne", "", "", "", ""],
    ["Arbustes", "", "", "", ""],
    ["", "", "", "", ""],
    ["", "", "", "", ""],
    ["", "", "", "", ""],
  ];

  const wsArbres = XLSX.utils.aoa_to_sheet(arbresData);
  wsArbres["!cols"] = [{ wch: 20 }, { wch: 16 }, { wch: 30 }, { wch: 25 }, { wch: 16 }];

  XLSX.utils.book_append_sheet(wb, wsArbres, "Arbres");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="template-verger.xlsx"',
    },
  });
}
