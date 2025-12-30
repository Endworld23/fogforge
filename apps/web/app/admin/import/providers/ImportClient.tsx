"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
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

const initialState: ActionState = {
  ok: false,
  inserted: 0,
  updated: 0,
  failed: 0,
  rowErrors: [],
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
    <section>
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
      >
        <label>
          CSV File
          <input
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
        </label>
        <button type="submit" disabled={rows.length === 0 || rowErrors.length > 0 || isPending}>
          {isPending ? "Importing..." : "Import"}
        </button>
      </form>

      {rowErrors.length > 0 && (
        <div>
          <h3>Row Errors</h3>
          <ul>
            {rowErrors.map((error) => (
              <li key={`${error.index}-${error.error}`}>
                Row {error.index + 1}: {error.error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {rows.length > 0 && (
        <div>
          <h3>Preview (first {previewRows.length} rows)</h3>
          <table>
            <thead>
              <tr>
                <th>business_name</th>
                <th>city</th>
                <th>state</th>
                <th>metro_slug</th>
                <th>category</th>
                <th>phone</th>
                <th>website_url</th>
              </tr>
            </thead>
            <tbody>
              {previewRows.map((row, index) => (
                <tr key={`${row.business_name}-${index}`}>
                  <td>{row.business_name}</td>
                  <td>{row.city}</td>
                  <td>{row.state}</td>
                  <td>{row.metro_slug}</td>
                  <td>{row.category}</td>
                  <td>{row.phone ?? ""}</td>
                  <td>{row.website_url ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {result?.message && <p>{result.message}</p>}
      {result && (result.inserted > 0 || result.updated > 0 || result.failed > 0) && (
        <div>
          <p>
            Inserted: {result.inserted}, Updated: {result.updated}, Failed: {result.failed}
          </p>
          {result.rowErrors.length > 0 && (
            <ul>
              {result.rowErrors.map((error) => (
                <li key={`${error.index}-${error.error}`}>
                  Row {error.index + 1}: {error.error}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
