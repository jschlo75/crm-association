import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { CompteForm } from "@/components/ui/compte-form";

export default async function ModifierComptePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role: string })?.role;
  const { id } = await params;
  if (role !== "ADMIN") redirect(`/comptes/${id}`);

  const compte = await prisma.compte.findUnique({ where: { id } });
  if (!compte) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Modifier le compte</h1>
      <CompteForm
        defaultValues={{
          id: compte.id,
          nom: compte.nom,
          type: compte.type,
          email: compte.email || "",
          telephone: compte.telephone || "",
          adresse: compte.adresse || "",
          codePostal: compte.codePostal || "",
          ville: compte.ville || "",
          pays: compte.pays,
          notes: compte.notes || "",
        }}
      />
    </div>
  );
}
