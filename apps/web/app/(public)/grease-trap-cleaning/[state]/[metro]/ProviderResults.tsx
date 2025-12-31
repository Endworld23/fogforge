"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../components/ui/card";
import { Input } from "../../../../../components/ui/input";

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
      <Input
        placeholder="Search providers by name"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />

      {filteredProviders.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            No providers match that search yet.
          </CardContent>
        </Card>
      ) : (
        <section className="grid gap-4 md:grid-cols-2">
          {filteredProviders.map((provider) => (
            <Link
              key={provider.id}
              href={`/grease-trap-cleaning/${state}/${metro}/${provider.slug}`}
              className="block"
            >
              <Card>
                <CardHeader>
                  <CardTitle>{provider.business_name}</CardTitle>
                  <CardDescription>
                    {provider.city}, {provider.state}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-2 text-sm text-foreground">
                  {provider.phone ? <span className="text-primary">{provider.phone}</span> : null}
                  {provider.website_url ? (
                    <span className="text-muted-foreground">Website available</span>
                  ) : null}
                </CardContent>
              </Card>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}
