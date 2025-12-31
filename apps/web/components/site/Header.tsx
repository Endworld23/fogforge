"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Building2, LogOut, ShieldCheck, User } from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Separator } from "../ui/separator";
import { cn } from "../../lib/utils";
import { getMetroSuggestions, getStateMatches, type MetroOption } from "../../lib/metroSearch";

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
  const [metros, setMetros] = useState<MetroOption[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const suggestions = useMemo(() => getMetroSuggestions(metros, query), [metros, query]);
  const stateMatches = useMemo(() => getStateMatches(query), [query]);

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

  useEffect(() => {
    const fetchMetros = async () => {
      try {
        const response = await fetch("/api/metros");
        if (!response.ok) return;
        const data = (await response.json()) as MetroOption[];
        setMetros(data);
      } catch {
        setMetros([]);
      }
    };

    fetchMetros();
  }, []);

  return (
    <header className="relative z-50 border-b border-border bg-background/90 backdrop-blur">
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
            {!isAuthenticated ? (
              <Link className="rounded-full px-3 py-1 transition hover:text-foreground" href="/login">
                Login
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
            }}
          >
            <div className="relative w-full">
              <Input
                placeholder="Search metros"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setSearchOpen(true);
                  setActiveIndex(-1);
                }}
                onFocus={() => setSearchOpen(true)}
                onBlur={() => {
                  setTimeout(() => {
                    setSearchOpen(false);
                    setActiveIndex(-1);
                  }, 100);
                }}
                onKeyDown={(event) => {
                  if (!searchOpen || suggestions.length === 0) return;
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    setActiveIndex((prev) => (prev + 1) % suggestions.length);
                  } else if (event.key === "ArrowUp") {
                    event.preventDefault();
                    setActiveIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
                  } else if (event.key === "Enter" && activeIndex >= 0) {
                    event.preventDefault();
                    const selected = suggestions[activeIndex];
                    router.push(
                      `/grease-trap-cleaning/${selected.state.toLowerCase()}/${selected.slug}`
                    );
                  } else if (event.key === "Escape") {
                    setSearchOpen(false);
                  }
                }}
              />
              {searchOpen && suggestions.length > 0 ? (
                <div
                  className="absolute z-50 mt-2 w-full rounded-md border border-border bg-background shadow-lg"
                  role="listbox"
                >
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={`${suggestion.slug}-${suggestion.state}`}
                      type="button"
                      role="option"
                      aria-selected={activeIndex === index}
                      className={
                        activeIndex === index
                          ? "flex w-full items-center justify-between rounded-md bg-muted px-3 py-2 text-left text-sm text-foreground"
                          : "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm text-foreground hover:bg-muted"
                      }
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        router.push(
                          `/grease-trap-cleaning/${suggestion.state.toLowerCase()}/${suggestion.slug}`
                        );
                        setSearchOpen(false);
                      }}
                    >
                      <span>{suggestion.name}</span>
                      <span className="text-xs text-muted-foreground">{suggestion.state}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
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
                  <form action="/logout" method="post">
                    <button
                      type="submit"
                      className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-foreground hover:bg-muted"
                      onClick={() => setMenuOpen(false)}
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </form>
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

          {stateMatches.length > 0 ? (
            <span className="hidden text-xs text-muted-foreground lg:inline">
              Filtering {stateMatches.join(", ")}
            </span>
          ) : null}
        </div>
      </div>
    </header>
  );
}
