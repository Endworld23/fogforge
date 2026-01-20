"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import AdminEmptyState from "../../../components/admin/AdminEmptyState";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { updateProviderPublishAction } from "./actions";

type ProviderRow = {
  id: string;
  business_name: string;
  slug: string;
  status: string;
  is_published: boolean;
  provider_state: "UNCLAIMED" | "CLAIMED_UNVERIFIED" | "VERIFIED";
};

type ProvidersTableProps = {
  providers: ProviderRow[];
};

export default function ProvidersTable({ providers }: ProvidersTableProps) {
  const [query, setQuery] = useState("");
  const [localProviders, setLocalProviders] = useState(providers);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return localProviders;
    return localProviders.filter((provider) => {
      const name = provider.business_name.toLowerCase();
      const slug = provider.slug.toLowerCase();
      return name.includes(normalized) || slug.includes(normalized);
    });
  }, [localProviders, query]);

  const providerStateBadge = (state: ProviderRow["provider_state"]) => {
    switch (state) {
      case "VERIFIED":
        return { label: "Verified", variant: "secondary" as const };
      case "CLAIMED_UNVERIFIED":
        return { label: "Claimed (unverified)", variant: "outline" as const };
      default:
        return { label: "Unclaimed", variant: "outline" as const };
    }
  };

  const handlePublishToggle = (providerId: string, nextValue: boolean) => {
    setPendingId(providerId);
    startTransition(async () => {
      const result = await updateProviderPublishAction(providerId, nextValue);
      if (result.ok) {
        setLocalProviders((prev) =>
          prev.map((provider) =>
            provider.id === providerId
              ? { ...provider, is_published: Boolean(result.is_published) }
              : provider
          )
        );
        setNotice(null);
      } else {
        setNotice(result.message);
      }
      setPendingId(null);
    });
  };

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  return (
    <div className="space-y-4">
      {notice ? (
        <Alert className="border-rose-200 bg-rose-50 text-rose-900">
          <AlertDescription className="text-rose-900">{notice}</AlertDescription>
        </Alert>
      ) : null}
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
        <AdminEmptyState
          title="No providers found"
          description="Try a different search term."
          action={
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/import/providers">Import providers</Link>
            </Button>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Provider</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Publish</TableHead>
              <TableHead>Account</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((provider) => {
              const stateBadge = providerStateBadge(provider.provider_state);
              return (
              <TableRow key={provider.id}>
                <TableCell className="font-medium">
                  <Link
                    href={`/admin/providers/${provider.slug}`}
                    className="text-foreground hover:underline"
                  >
                    {provider.business_name}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{provider.status}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={provider.is_published ? "secondary" : "outline"}>
                      {provider.is_published ? "Published" : "Draft"}
                    </Badge>
                    <Button
                      size="sm"
                      type="button"
                      variant={provider.is_published ? "outline" : "default"}
                      disabled={isPending && pendingId === provider.id}
                      onClick={() =>
                        handlePublishToggle(provider.id, !provider.is_published)
                      }
                    >
                      {isPending && pendingId === provider.id
                        ? provider.is_published
                          ? "Unpublishing..."
                          : "Publishing..."
                        : provider.is_published
                          ? "Unpublish"
                          : "Publish"}
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={stateBadge.variant}>{stateBadge.label}</Badge>
                </TableCell>
              </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
