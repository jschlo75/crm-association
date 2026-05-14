import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = (session.user as { role: string }).role;
  const userName = (session.user as { name?: string }).name || session.user?.email || "";

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={role} userName={userName} />
      {/* Sur mobile : pas de marge gauche + padding top pour le bouton hamburger */}
      <div className="flex-1 lg:ml-64">
        <main className="p-4 pt-14 lg:p-6 lg:pt-6">{children}</main>
      </div>
    </div>
  );
}
