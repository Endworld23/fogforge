"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
  provider_state: "UNCLAIMED" | "CLAIMED_UNVERIFIED" | "VERIFIED";
};

type ProvidersGridProps = {
  providers: ProviderRow[];
  totalCount: number;
  state: string;
  metro: string;
};

export default function ProvidersGrid({
  providers,
  totalCount,
  state,
  metro,
}: ProvidersGridProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const urlQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(urlQuery);

  useEffect(() => {
    if (urlQuery !== query) {
      setQuery(urlQuery);
    }
  }, [urlQuery, query]);

  useEffect(() => {
    if (query === urlQuery) return;
    const handle = window.setTimeout(() => {
      const params = new URLSearchParams(searchParamsString);
      if (query.trim()) {
        params.set("q", query.trim());
      } else {
        params.delete("q");
      }
      params.delete("page");
      const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.replace(nextUrl);
    }, 300);

    return () => window.clearTimeout(handle);
  }, [query, urlQuery, pathname, router, searchParamsString]);

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
          {totalCount} provider{totalCount === 1 ? "" : "s"}
        </Badge>
      </div>

      {providers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center text-sm text-muted-foreground">
            <p>No results match your search in this metro.</p>
            <Button type="button" variant="outline" onClick={handleClearSearch}>
              Clear search
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {providers.map((provider) => {
            const providerState = provider.provider_state;
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
                    {providerState === "VERIFIED" ? (
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
