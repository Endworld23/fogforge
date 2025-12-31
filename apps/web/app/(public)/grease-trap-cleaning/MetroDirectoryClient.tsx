"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { ChevronRight, Search } from "lucide-react";

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

  const states = useMemo(() => {
    const unique = new Set(metros.map((metro) => metro.state));
    return ["all", ...Array.from(unique).sort()];
  }, [metros]);

  const filteredMetros = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return metros.filter((metro) => {
      const matchesQuery = normalizedQuery
        ? metro.name.toLowerCase().includes(normalizedQuery)
        : true;
      const matchesState = stateFilter === "all" ? true : metro.state === stateFilter;
      return matchesQuery && matchesState;
    });
  }, [metros, query, stateFilter]);

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
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Filter by metro name or choose a state.
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
        <p className="text-sm text-muted-foreground">{filteredMetros.length} metros</p>
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
