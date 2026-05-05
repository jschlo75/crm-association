"use client";

import { useSession } from "next-auth/react";

export function Header({ title }: { title?: string }) {
  const { data: session } = useSession();

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600">{session?.user?.name}</span>
        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">
          {session?.user?.name?.[0]?.toUpperCase()}
        </div>
      </div>
    </header>
  );
}
