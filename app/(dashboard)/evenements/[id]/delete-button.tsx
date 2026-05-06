"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";

export function DeleteEvenementButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Supprimer cet événement et tous ses participants ?")) return;
    setLoading(true);
    const res = await fetch(`/api/evenements/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/evenements");
      router.refresh();
    } else {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
    >
      <Trash2 size={15} />
      Supprimer
    </button>
  );
}
