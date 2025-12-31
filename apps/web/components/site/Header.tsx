"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, Building2, LogOut, ShieldCheck, User } from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Separator } from "../ui/separator";
import { cn } from "../../lib/utils";

type HeaderProps = {
  isAuthenticated: boolean;
  isAdmin: boolean;
  isProvider: boolean;
  userEmail: string | null;
};

export default function Header({ isAuthenticated, isAdmin, isProvider, userEmail }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isGreaseTrap = pathname?.startsWith("/grease-trap-cleaning");
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const accountLabel = isAdmin ? "Admin" : isProvider ? "Provider" : "Account";

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
    <header className="border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center justify-between gap-6 lg:justify-start">
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
            {isAuthenticated ? (
              <Link className="rounded-full px-3 py-1 transition hover:text-foreground" href="/dashboard">
                Dashboard
              </Link>
            ) : (
              <Link
                className="rounded-full px-3 py-1 transition hover:text-foreground"
                href="/login"
              >
                For providers
              </Link>
            )}
            {isAdmin ? (
              <Link className="rounded-full px-3 py-1 transition hover:text-foreground" href="/admin">
                Admin
              </Link>
            ) : null}
          </nav>
        </div>
        <div className="flex flex-1 items-center gap-3 lg:justify-end">
          <form
            className="flex w-full max-w-md items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              const trimmed = query.trim();
              if (!trimmed) {
                return;
              }
              router.push(`/grease-trap-cleaning?query=${encodeURIComponent(trimmed)}`);
              setQuery("");
            }}
          >
            <Input
              placeholder="Search metros"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <Button type="submit" variant="outline">
              Search
            </Button>
          </form>

          {isAuthenticated ? (
            <div className="relative" ref={menuRef}>
              <Button
                type="button"
                variant="outline"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                {accountLabel}
              </Button>
              {menuOpen ? (
                <Card className="absolute right-0 z-50 mt-2 w-56 border-border bg-background p-2 shadow-lg">
                  <div className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-foreground">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {accountLabel}
                  </div>
                  <div className="px-2 pb-1 text-xs text-muted-foreground">
                    {userEmail ?? "Signed in"}
                  </div>
                  <Separator className="my-1" />
                  <Link
                    className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-foreground hover:bg-muted"
                    href="/dashboard"
                    onClick={() => setMenuOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    Dashboard
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
                  ) : null}
                  <Link
                    className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-foreground hover:bg-muted"
                    href="/logout"
                    onClick={() => setMenuOpen(false)}
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Link>
                </Card>
              ) : null}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="outline">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/onboarding">List your business</Link>
              </Button>
            </div>
          )}

          {isAuthenticated ? (
            <Button asChild>
              <Link href="/dashboard" className="flex items-center gap-2">
                Go to dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
