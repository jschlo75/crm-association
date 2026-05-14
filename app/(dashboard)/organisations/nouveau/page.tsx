import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { OrganisationForm } from "@/components/ui/organisation-form";

export default async function NouvelleOrganisationPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role: string })?.role;
  if (role !== "ADMIN") redirect("/organisations");

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Nouvelle organisation</h1>
      <OrganisationForm />
    </div>
  );
}
