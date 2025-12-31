"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { ChevronRight, Search } from "lucide-react";
import { filterMetros, getMetroSuggestions, getStateMatches } from "../../../lib/metroSearch";

type MetroRow = {
  id: string;
  name: string;
  slug: string;
  state: string;
};

type MetroDirectoryClientProps = {
  metros: MetroRow[];
  initialQuery?: string;
};

export default function MetroDirectoryClient({
  metros,
  initialQuery = "",
}: MetroDirectoryClientProps) {
  const [query, setQuery] = useState(initialQuery);
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const states = useMemo(() => {
    const unique = new Set(metros.map((metro) => metro.state));
    return ["all", ...Array.from(unique).sort()];
  }, [metros]);

  const filteredMetros = useMemo(
    () => filterMetros(metros, query, stateFilter),
    [metros, query, stateFilter]
  );
  const suggestions = useMemo(
    () =>
      getMetroSuggestions(
        stateFilter === "all" ? metros : metros.filter((metro) => metro.state === stateFilter),
        query
      ),
    [metros, query, stateFilter]
  );
  const stateMatches = useMemo(() => getStateMatches(query), [query]);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="metro-search">
            Search metros
          </label>
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="metro-search"
              className="pl-9"
              placeholder="Search by metro name"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setIsOpen(true);
                setActiveIndex(-1);
              }}
              onFocus={() => setIsOpen(true)}
              onBlur={() => {
                setTimeout(() => {
                  setIsOpen(false);
                  setActiveIndex(-1);
                }, 100);
              }}
              onKeyDown={(event) => {
                if (!isOpen || suggestions.length === 0) return;
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setActiveIndex((prev) => (prev + 1) % suggestions.length);
                } else if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setActiveIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
                } else if (event.key === "Enter" && activeIndex >= 0) {
                  event.preventDefault();
                  const selected = suggestions[activeIndex];
                  window.location.href = `/grease-trap-cleaning/${selected.state.toLowerCase()}/${selected.slug}`;
                } else if (event.key === "Escape") {
                  setIsOpen(false);
                }
              }}
            />
            {isOpen && suggestions.length > 0 ? (
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
                      window.location.href = `/grease-trap-cleaning/${suggestion.state.toLowerCase()}/${suggestion.slug}`;
                    }}
                  >
                    <span>{suggestion.name}</span>
                    <span className="text-xs text-muted-foreground">{suggestion.state}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            Filter by metro name or choose a state. Try "TX" or "Texas".
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {states.map((state) => (
            <Button
              key={state}
              type="button"
              size="sm"
              variant={stateFilter === state ? "default" : "outline"}
              onClick={() => setStateFilter(state)}
            >
              {state === "all" ? "All states" : state}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Launch metros</h2>
        <p className="text-sm text-muted-foreground">
          {filteredMetros.length} metros
          {stateMatches.length > 0 ? ` in ${stateMatches.join(", ")}` : ""}
        </p>
      </div>

      {filteredMetros.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No metros found. Try another search or state filter.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredMetros.map((metro) => (
            <Card key={metro.id} className="transition hover:border-primary/40">
              <CardHeader>
                <CardTitle className="text-lg">{metro.name}</CardTitle>
                <Badge className="mt-2 w-fit" variant="outline">
                  {metro.state}
                </Badge>
              </CardHeader>
              <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Explore providers</span>
                <Link
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                  href={`/grease-trap-cleaning/${metro.state.toLowerCase()}/${metro.slug}`}
                >
                  View
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
