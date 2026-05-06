import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { ContactForm } from "@/components/ui/contact-form";
import { format } from "date-fns";

export default async function ModifierContactPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role: string })?.role;
  const { id } = await params;
  if (role !== "ADMIN") redirect(`/contacts/${id}`);

  const contact = await prisma.contact.findUnique({ where: { id } });
  if (!contact) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Modifier le contact</h1>
      <ContactForm
        defaultValues={{
          id: contact.id,
          prenom: contact.prenom,
          nom: contact.nom,
          poste: contact.poste || "",
          email: contact.email || "",
          telephone: contact.telephone || "",
          adresse: contact.adresse || "",
          codePostal: contact.codePostal || "",
          ville: contact.ville || "",
          pays: contact.pays,
          notes: contact.notes || "",
          compteId: contact.compteId || "",
          isMembre: contact.isMembre,
          dateAdhesion: contact.dateAdhesion
            ? format(new Date(contact.dateAdhesion), "yyyy-MM-dd")
            : "",
        }}
      />
    </div>
  );
}
