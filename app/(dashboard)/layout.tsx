import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = (session.user as { role: string }).role;

  return (
    <div className="flex min-h-screen">
      <Sidebar role={role} />
      <div className="flex-1 ml-64">
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
