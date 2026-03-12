import Image from "next/image";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import userIconSmall from "@/public/userIconSmall.svg";

export function Navbar({
  name,
  title,
}: {
  name?: string;
  title?: string;
}) {
  return (
    <nav className="w-full border-b border-border bg-white">
      <div className="mx-auto flex h-20 max-w-5xl items-center justify-between gap-6 px-6 py-4 sm:px-8">
        <span className="truncate font-bold text-primary text-2xl">
          {title ?? "Dashboard"}
        </span>
        <Link
          href="/protected/profile"
          className="inline-flex items-center gap-3 rounded-2xl border border-border bg-background px-5 py-2.5 text-base text-foreground hover:bg-muted/80 transition-colors"
        >
          <Image src={userIconSmall} alt="User Icon" width={28} height={28} className="shrink-0" />
          <span className="truncate">{name ?? "User"}</span>
          <ChevronDown className="h-5 w-5 shrink-0 text-foreground" />
        </Link>
      </div>
    </nav>
  );
}
