import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { OrganisationForm } from "@/components/ui/organisation-form";

export default async function ModifierOrganisationPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role: string })?.role;
  const { id } = await params;
  if (role !== "ADMIN") redirect(`/organisations/${id}`);

  const organisation = await prisma.organisation.findUnique({ where: { id } });
  if (!organisation) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Modifier l&apos;organisation</h1>
      <OrganisationForm
        defaultValues={{
          id: organisation.id,
          nom: organisation.nom,
          type: organisation.type,
          email: organisation.email || "",
          telephone: organisation.telephone || "",
          siteWeb: organisation.siteWeb || "",
          adresse: organisation.adresse || "",
          codePostal: organisation.codePostal || "",
          ville: organisation.ville || "",
          pays: organisation.pays,
          notes: organisation.notes || "",
          parentId: organisation.parentId || "",
        }}
      />
    </div>
  );
}
