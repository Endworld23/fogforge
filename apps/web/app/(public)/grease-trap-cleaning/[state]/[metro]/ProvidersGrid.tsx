"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ShieldCheck } from "lucide-react";
import { Badge } from "../../../../../components/ui/badge";
import { Button } from "../../../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../components/ui/card";
import { Input } from "../../../../../components/ui/input";

type ProviderRow = {
  id: string;
  slug: string;
  business_name: string;
  city: string;
  state: string;
  phone: string | null;
  website_url: string | null;
  description: string | null;
};

type ProvidersGridProps = {
  providers: ProviderRow[];
  state: string;
  metro: string;
};

export default function ProvidersGrid({ providers, state, metro }: ProvidersGridProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return providers;
    return providers.filter((provider) => {
      const name = provider.business_name.toLowerCase();
      const slug = provider.slug.toLowerCase();
      return name.includes(normalized) || slug.includes(normalized);
    });
  }, [providers, query]);

  const handleClearSearch = () => setQuery("");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search providers"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <Badge variant="outline">
          {filtered.length} provider{filtered.length === 1 ? "" : "s"}
        </Badge>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center text-sm text-muted-foreground">
            <p>No results match your search.</p>
            <Button type="button" variant="outline" onClick={handleClearSearch}>
              Clear search
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((provider) => {
            const isVerified = Boolean(provider.phone || provider.website_url);
            const locationLabel =
              provider.city && provider.state
                ? `${provider.city}, ${provider.state}`
                : "Location not set";
            const detailHref = `/grease-trap-cleaning/${state}/${metro}/${provider.slug}`;
            return (
              <Card key={provider.id} className="flex h-full flex-col">
                <CardHeader className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">
                      <Link href={detailHref} className="hover:underline">
                        {provider.business_name}
                      </Link>
                    </CardTitle>
                    {isVerified ? (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Verified
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-sm text-muted-foreground">{locationLabel}</p>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4 text-sm text-muted-foreground">
                  <p className="line-clamp-2">
                    {provider.description ??
                      "Request a quote to compare services, pricing, and availability."}
                  </p>
                  <div className="mt-auto">
                    <Button asChild className="w-full">
                      <Link href={detailHref}>View details</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
