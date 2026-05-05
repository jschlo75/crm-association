import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CompteForm } from "@/components/ui/compte-form";

export default async function NouveauComptePage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role: string })?.role;
  if (role !== "ADMIN") redirect("/comptes");

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Nouveau compte</h1>
      <CompteForm />
    </div>
  );
}
