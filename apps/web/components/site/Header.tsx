"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Building2 } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

export default function Header() {
  const pathname = usePathname();
  const isGreaseTrap = pathname?.startsWith("/grease-trap-cleaning");

  return (
    <header className="border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <Link className="flex items-center gap-3" href="/">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Building2 className="h-4 w-4" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-base font-semibold text-foreground">Fogforge</span>
              <span className="text-xs text-muted-foreground">Grease Trap Pros</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-3 text-sm text-muted-foreground md:flex">
            <Link
              className={cn(
                "rounded-full px-3 py-1 transition hover:text-foreground",
                isGreaseTrap ? "bg-primary/10 text-foreground" : ""
              )}
              href="/grease-trap-cleaning"
            >
              Grease Trap Cleaning
            </Link>
            <Link
              className="rounded-full px-3 py-1 transition hover:text-foreground"
              href="/login"
            >
              For providers
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Link className="text-sm text-muted-foreground transition hover:text-foreground" href="/login">
            Admin
          </Link>
          <Button asChild>
            <Link href="/login" className="flex items-center gap-2">
              List your business
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
