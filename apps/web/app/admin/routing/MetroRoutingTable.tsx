"use client";

import { useState, useTransition } from "react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { resetMetroRotationAction } from "../leads/actions";

type ProviderOption = {
  id: string;
  business_name: string | null;
};

type MetroRoutingRow = {
  id: string;
  name: string;
  state: string;
  providers: ProviderOption[];
  last_provider_id: string | null;
  last_assigned_at: string | null;
};

type MetroRoutingTableProps = {
  metros: MetroRoutingRow[];
};

export default function MetroRoutingTable({ metros }: MetroRoutingTableProps) {
  const [rows, setRows] = useState(metros);
  const [isPending, startTransition] = useTransition();

  const handleReset = (metroId: string) => {
    startTransition(async () => {
      const result = await resetMetroRotationAction(metroId);
      if (result.ok) {
        setRows((prev) =>
          prev.map((row) =>
            row.id === metroId
              ? { ...row, last_provider_id: null, last_assigned_at: null }
              : row
          )
        );
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Metro rotation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {rows.map((metro) => (
          <div key={metro.id} className="rounded-lg border border-border/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-foreground">
                  {metro.name}, {metro.state}
                </div>
                <div className="text-xs text-muted-foreground">
                  Last assigned:{" "}
                  {metro.last_assigned_at ? new Date(metro.last_assigned_at).toLocaleString() : "—"}
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => handleReset(metro.id)}
              >
                Reset rotation
              </Button>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              Last provider: {metro.last_provider_id ?? "—"}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {metro.providers.length ? (
                metro.providers.map((provider) => (
                  <span
                    key={provider.id}
                    className="rounded-full border border-border/70 px-3 py-1 text-xs text-foreground"
                  >
                    {provider.business_name ?? "Unnamed provider"}
                  </span>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">
                  No verified providers in this metro.
                </span>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
