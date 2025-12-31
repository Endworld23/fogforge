"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "../../../../../components/ui/badge";
import { Button } from "../../../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../components/ui/card";
import { Input } from "../../../../../components/ui/input";
import { ArrowRight, Globe, MapPin, Phone, Search } from "lucide-react";

type ProviderRow = {
  id: string;
  slug: string;
  business_name: string;
  city: string;
  state: string;
  phone: string | null;
  website_url: string | null;
};

type ProviderResultsProps = {
  providers: ProviderRow[];
  state: string;
  metro: string;
};

export default function ProviderResults({ providers, state, metro }: ProviderResultsProps) {
  const [query, setQuery] = useState("");

  const filteredProviders = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return providers;
    }
    return providers.filter((provider) =>
      provider.business_name.toLowerCase().includes(normalized)
    );
  }, [providers, query]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="provider-search">
          Search providers
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="provider-search"
            className="pl-9"
            placeholder="Search by provider name"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Tip: try city or business name for quicker results.
        </p>
      </div>

      {filteredProviders.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            No providers match that search yet.
          </CardContent>
        </Card>
      ) : (
        <section className="grid gap-4 md:grid-cols-2">
          {filteredProviders.map((provider) => (
            <Card key={provider.id} className="flex h-full flex-col transition hover:border-primary/40">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-lg">{provider.business_name}</CardTitle>
                  {provider.website_url ? (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Globe className="h-3.5 w-3.5" />
                      Website
                    </Badge>
                  ) : null}
                </div>
                <CardDescription className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {provider.city}, {provider.state}
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto flex flex-col gap-3 text-sm text-foreground">
                {provider.phone ? (
                  <div className="flex items-center gap-2 text-primary">
                    <Phone className="h-4 w-4" />
                    <span>{provider.phone}</span>
                  </div>
                ) : null}
                <Button variant="outline" asChild>
                  <Link
                    href={`/grease-trap-cleaning/${state}/${metro}/${provider.slug}`}
                    className="flex items-center gap-2"
                  >
                    View details
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </section>
      )}
    </div>
  );
}
