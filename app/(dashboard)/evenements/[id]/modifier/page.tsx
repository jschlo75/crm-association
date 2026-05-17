import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { EvenementForm } from "@/components/ui/evenement-form";
import { format } from "date-fns";

export default async function ModifierEvenementPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role: string })?.role;
  if (role !== "ADMIN") redirect("/evenements");

  const { id } = await params;
  const evenement = await prisma.evenement.findUnique({ where: { id } });
  if (!evenement) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Modifier l'événement</h1>
      <EvenementForm
        defaultValues={{
          id: evenement.id,
          titre: evenement.titre,
          date: format(new Date(evenement.date), "yyyy-MM-dd'T'HH:mm"),
          lieu: evenement.lieu ?? "",
          lien: evenement.lien ?? "",
          objectifs: evenement.objectifs ?? "",
        }}
      />
    </div>
  );
}
