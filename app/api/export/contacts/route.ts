import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role: string })?.role;
  if (!session || role !== "ADMIN")
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const contacts = await prisma.contact.findMany({
    orderBy: [{ nom: "asc" }, { prenom: "asc" }],
    include: {
      organisation: { select: { nom: true } },
    },
  });

  const rows = contacts.map((c) => ({
    "Nom":            c.nom,
    "Prénom":         c.prenom,
    "Poste":          c.poste ?? "",
    "Email":          c.email ?? "",
    "Téléphone":      c.telephone ?? "",
    "Organisation":   c.organisation?.nom ?? "",
    "Adresse":        c.adresse ?? "",
    "Code postal":    c.codePostal ?? "",
    "Ville":          c.ville ?? "",
    "Pays":           c.pays ?? "",
    "Membre SNHF":    c.isMembre ? "Oui" : "Non",
    "Date adhésion":  c.dateAdhesion
      ? new Date(c.dateAdhesion).toLocaleDateString("fr-FR")
      : "",
    "Notes":          c.notes ?? "",
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);

  // Largeurs de colonnes automatiques
  const colWidths = Object.keys(rows[0] ?? {}).map((key) => ({
    wch: Math.max(
      key.length,
      ...rows.map((r) => String(r[key as keyof typeof r] ?? "").length)
    ) + 2,
  }));
  ws["!cols"] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, "Contacts");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="contacts_${date}.xlsx"`,
    },
  });
}
