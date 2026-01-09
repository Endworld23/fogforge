"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { FileUp, UploadCloud } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../../../../components/ui/alert";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Input } from "../../../../components/ui/input";
import { Separator } from "../../../../components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../components/ui/table";
import { createBrowserClient } from "../../../../lib/supabase/browser";
import { importProvidersAction } from "./actions";

type ImportRow = {
  business_name: string;
  city: string;
  state: string;
  metro_slug: string;
  category: string;
  phone?: string;
  website_url?: string;
  email_public?: string;
  description?: string;
  street?: string;
  postal_code?: string;
};

type ActionState = {
  ok: boolean;
  message?: string;
  inserted: number;
  updated: number;
  failed: number;
  rowErrors: Array<{ index: number; error: string }>;
};

function parseCsv(text: string) {
  const rows: string[][] = [];
  let current: string[] = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && next === '"') {
      value += '"';
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (!inQuotes && (char === "," || char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") {
        i += 1;
      }
      if (char === "," || char === "\n" || char === "\r") {
        current.push(value);
        value = "";
      }
      if (char === "\n" || char === "\r") {
        rows.push(current);
        current = [];
      }
      continue;
    }

    value += char;
  }

  if (value.length > 0 || current.length > 0) {
    current.push(value);
    rows.push(current);
  }

  return rows;
}

function normalizeHeader(header: string) {
  return header.trim().toLowerCase().replace(/\s+/g, "_");
}

function buildRows(csv: string) {
  const parsed = parseCsv(csv).filter((row) => row.some((cell) => cell.trim().length > 0));
  if (parsed.length === 0) {
    return { rows: [], errors: [] };
  }

  const headers = parsed[0].map((header) => normalizeHeader(header));
  const rows: ImportRow[] = [];
  const errors: Array<{ index: number; error: string }> = [];

  for (let i = 1; i < parsed.length; i += 1) {
    const rowData: Record<string, string> = {};
    const row = parsed[i];
    headers.forEach((header, idx) => {
      rowData[header] = (row[idx] ?? "").trim();
    });

    const data: ImportRow = {
      business_name: rowData.business_name ?? "",
      city: rowData.city ?? "",
      state: rowData.state ?? "",
      metro_slug: rowData.metro_slug ?? "",
      category: rowData.category ?? "",
      phone: rowData.phone || undefined,
      website_url: rowData.website_url || undefined,
      email_public: rowData.email_public || undefined,
      description: rowData.description || undefined,
      street: rowData.street || undefined,
      postal_code: rowData.postal_code || undefined,
    };

    const rowErrors: string[] = [];
    if (!data.business_name) rowErrors.push("Missing business_name");
    if (!data.city) rowErrors.push("Missing city");
    if (!data.state) rowErrors.push("Missing state");
    if (!data.metro_slug) rowErrors.push("Missing metro_slug");
    if (!data.category) rowErrors.push("Missing category");
    if (data.category && data.category !== "grease-trap-cleaning") {
      rowErrors.push("Category must be grease-trap-cleaning");
    }
    if (!data.phone && !data.website_url) {
      rowErrors.push("Phone or website_url required");
    }

    if (rowErrors.length > 0) {
      errors.push({ index: i - 1, error: rowErrors.join("; ") });
    }

    rows.push(data);
  }

  return { rows, errors };
}

export default function ImportClient() {
  const [csvText, setCsvText] = useState("");
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [rowErrors, setRowErrors] = useState<ActionState["rowErrors"]>([]);
  const [accessToken, setAccessToken] = useState("");
  const [result, setResult] = useState<ActionState | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const supabase = createBrowserClient();
    supabase.auth.getSession().then(({ data }) => {
      setAccessToken(data.session?.access_token ?? "");
    });
  }, []);

  useEffect(() => {
    if (!csvText) {
      setRows([]);
      setRowErrors([]);
      return;
    }
    const parsed = buildRows(csvText);
    setRows(parsed.rows);
    setRowErrors(parsed.errors);
  }, [csvText]);

  const previewRows = useMemo(() => rows.slice(0, 50), [rows]);

  return (
    <section className="space-y-6">
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UploadCloud className="h-5 w-5 text-primary" />
            Upload CSV
          </CardTitle>
          <CardDescription>
            CSV headers must match the Admin Import template. We will preview the first 50 rows.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData();
              formData.append("payload", JSON.stringify(rows));
              formData.append("accessToken", accessToken);
              startTransition(async () => {
                const nextResult = await importProvidersAction(formData);
                setResult(nextResult);
              });
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="csv-file">
                CSV file
              </label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv,text/csv"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    setCsvText(String(reader.result ?? ""));
                  };
                  reader.readAsText(file);
                }}
              />
              <p className="text-xs text-muted-foreground">
                Include business_name, city, state, metro_slug, category, and at least phone or
                website_url.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="submit"
                disabled={rows.length === 0 || rowErrors.length > 0 || isPending}
              >
                {isPending ? "Importing..." : "Import"}
              </Button>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <Badge variant="outline">{rows.length} rows</Badge>
                <Badge variant="outline">{rowErrors.length} issues</Badge>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {rowErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertTitle>Row errors</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              {rowErrors.map((error) => (
                <li key={`${error.index}-${error.error}`}>
                  Row {error.index + 1}: {error.error}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {rows.length > 0 && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Preview</CardTitle>
            <CardDescription>First {previewRows.length} rows.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>business_name</TableHead>
                  <TableHead>city</TableHead>
                  <TableHead>state</TableHead>
                  <TableHead>metro_slug</TableHead>
                  <TableHead>category</TableHead>
                  <TableHead>phone</TableHead>
                  <TableHead>website_url</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewRows.map((row, index) => (
                  <TableRow key={`${row.business_name}-${index}`}>
                    <TableCell>{row.business_name}</TableCell>
                    <TableCell>{row.city}</TableCell>
                    <TableCell>{row.state}</TableCell>
                    <TableCell>{row.metro_slug}</TableCell>
                    <TableCell>{row.category}</TableCell>
                    <TableCell>{row.phone ?? ""}</TableCell>
                    <TableCell>{row.website_url ?? ""}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {result?.message && (
        <Alert className="border-amber-200 bg-amber-50 text-amber-900">
          <AlertTitle>Import status</AlertTitle>
          <AlertDescription className="text-amber-900">{result.message}</AlertDescription>
        </Alert>
      )}
      {result && (result.inserted > 0 || result.updated > 0 || result.failed > 0) && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileUp className="h-5 w-5 text-primary" />
              Import summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Inserted: {result.inserted}</Badge>
              <Badge variant="secondary">Updated: {result.updated}</Badge>
              <Badge variant="secondary">Failed: {result.failed}</Badge>
            </div>
            {result.rowErrors.length > 0 ? (
              <>
                <Separator />
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {result.rowErrors.map((error) => (
                    <li key={`${error.index}-${error.error}`}>
                      Row {error.index + 1}: {error.error}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </CardContent>
        </Card>
      )}
    </section>
  );
}
