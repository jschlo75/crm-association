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

  const users = await prisma.user.findMany({
    orderBy: { nom: "asc" },
    include: { organisation: { select: { nom: true } } },
  });

  const rows = users.map((u) => ({
    "Nom":           u.nom,
    "Email":         u.email,
    "Rôle":          u.role === "ADMIN" ? "Administrateur" : u.role === "RESTREINT" ? "Restreint" : "Membre",
    "Statut":        u.actif ? "Actif" : "Inactif",
    "Organisation":  u.organisation?.nom ?? "",
    "Créé le":       new Date(u.createdAt).toLocaleDateString("fr-FR"),
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);

  const colWidths = Object.keys(rows[0] ?? {}).map((key) => ({
    wch: Math.max(key.length, ...rows.map((r) => String(r[key as keyof typeof r] ?? "").length)) + 2,
  }));
  ws["!cols"] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, "Utilisateurs");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="utilisateurs_${date}.xlsx"`,
    },
  });
}
