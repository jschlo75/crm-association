import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { VergerForm } from "@/components/ui/verger-form";

export default async function ModifierVergerPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role: string })?.role;
  if (role !== "ADMIN") redirect("/dashboard");

  const { id } = await params;
  const verger = await prisma.verger.findUnique({
    where: { id },
    include: { arbres: { orderBy: { ordre: "asc" } } },
  });
  if (!verger) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Modifier le verger</h1>
      <VergerForm initialData={{
        ...verger,
        id,
        arbres: verger.arbres.map((a) => ({
          espece: a.espece,
          nbArbres: a.nbArbres,
          varietes: a.varietes ?? "",
          formes: a.formes ?? "",
          ageMoyen: a.ageMoyen,
        })),
      }} />
    </div>
  );
}
