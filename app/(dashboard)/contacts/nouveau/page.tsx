import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ContactForm } from "@/components/ui/contact-form";

export default async function NouveauContactPage({
  searchParams,
}: {
  searchParams: Promise<{ organisationId?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role: string })?.role;
  if (role !== "ADMIN") redirect("/contacts");

  const { organisationId } = await searchParams;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Nouveau contact</h1>
      <ContactForm defaultOrganisationId={organisationId} />
    </div>
  );
}
