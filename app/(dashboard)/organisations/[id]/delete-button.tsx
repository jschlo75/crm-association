"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function DeleteOrganisationButton({ id }: { id: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Supprimer cette organisation ? Les contacts et interactions associés resteront.")) return;
    await fetch(`/api/organisations/${id}`, { method: "DELETE" });
    router.push("/organisations");
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      className="flex items-center gap-2 bg-white border border-red-300 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
    >
      <Trash2 size={15} />
      Supprimer
    </button>
  );
}
