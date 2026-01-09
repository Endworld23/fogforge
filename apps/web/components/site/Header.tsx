"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, LogOut, ShieldCheck, User } from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Separator } from "../ui/separator";
import { cn } from "../../lib/utils";
import MetroSearch from "./MetroSearch";

type HeaderProps = {
  isAuthenticated: boolean;
  isAdmin: boolean;
  isProvider: boolean;
  userEmail: string | null;
};

export default function Header({ isAuthenticated, isAdmin, isProvider, userEmail }: HeaderProps) {
  const pathname = usePathname();
  const isGreaseTrap = pathname?.startsWith("/grease-trap-cleaning");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!menuRef.current || !event.target) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <header className="relative z-50 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center justify-between gap-4 md:justify-start">
          <Link className="flex items-center gap-3" href="/">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Building2 className="h-4 w-4" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-base font-semibold text-foreground">Fogforge</span>
              <span className="text-xs text-muted-foreground">Grease Trap Pros</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-3 text-sm text-muted-foreground lg:flex">
            <Link
              className={cn(
                "rounded-full px-3 py-1 transition hover:text-foreground",
                isGreaseTrap ? "bg-primary/10 text-foreground" : ""
              )}
              href="/grease-trap-cleaning"
            >
              Grease Trap Cleaning
            </Link>
          </nav>
        </div>
        <div className="flex w-full min-w-0 flex-1 items-center gap-3 md:justify-end">
          <div className="flex-1 min-w-0">
            <MetroSearch
              className="w-full min-w-0 max-w-md"
              inputClassName="h-9"
              buttonSize="sm"
              buttonVariant="outline"
              showStateMatches={false}
            />
          </div>

          {isAuthenticated ? (
            <div className="relative" ref={menuRef}>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((prev) => !prev)}
              >
                <User className="h-4 w-4" />
                <span className="sr-only">Account</span>
              </Button>
              {menuOpen ? (
                <Card className="absolute right-0 z-50 mt-2 w-56 border-border bg-background p-2 shadow-lg">
                  <>
                    <div className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-foreground">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {userEmail ?? "Signed in"}
                    </div>
                    <Separator className="my-1" />
                    <Link
                      className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-foreground hover:bg-muted"
                      href="/account"
                      onClick={() => setMenuOpen(false)}
                    >
                      <User className="h-4 w-4" />
                      Account preferences
                    </Link>
                    {isAdmin ? (
                      <Link
                        className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-foreground hover:bg-muted"
                        href="/admin"
                        onClick={() => setMenuOpen(false)}
                      >
                        <ShieldCheck className="h-4 w-4" />
                        Admin
                      </Link>
                    ) : isProvider ? (
                      <Link
                        className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-foreground hover:bg-muted"
                        href="/dashboard"
                        onClick={() => setMenuOpen(false)}
                      >
                        <User className="h-4 w-4" />
                        Dashboard
                      </Link>
                    ) : null}
                    <Link
                      className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-foreground hover:bg-muted"
                      href="/logout"
                      prefetch={false}
                      onClick={() => setMenuOpen(false)}
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </Link>
                  </>
                </Card>
              ) : null}
            </div>
          ) : (
            <Button asChild variant="outline">
              <Link href="/login">Sign in</Link>
            </Button>
          )}

        </div>
      </div>
    </header>
  );
}
