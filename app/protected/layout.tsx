"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/navbar";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const title = pathname?.endsWith("/profile")
    ? "Profile"
    : pathname?.endsWith("/diagnostics")
      ? "Diagnostics"
      : "Dashboard";

  return (
    <main className="flex flex-col">
      <Navbar title={title} />
      <div className="flex-1 w-full flex flex-col items-center">
        <div className="flex-1 w-full max-w-5xl flex flex-col px-6 py-4 sm:px-8">
          {children}
        </div>
      </div>
    </main>
  );
}
