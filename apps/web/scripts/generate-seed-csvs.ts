import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

type MetroSeed = {
  slug: string;
  name: string;
  state: string;
  city: string;
};

const METROS: MetroSeed[] = [
  { slug: "houston-tx", name: "Houston", state: "TX", city: "Houston" },
  { slug: "dallas-fort-worth-tx", name: "Dallas-Fort Worth", state: "TX", city: "Dallas" },
  { slug: "san-antonio-tx", name: "San Antonio", state: "TX", city: "San Antonio" },
  { slug: "austin-tx", name: "Austin", state: "TX", city: "Austin" },
  { slug: "corpus-christi-tx", name: "Corpus Christi", state: "TX", city: "Corpus Christi" },
  { slug: "mcallen-tx", name: "McAllen-Edinburg-Mission", state: "TX", city: "McAllen" },
  { slug: "el-paso-tx", name: "El Paso", state: "TX", city: "El Paso" },
  { slug: "phoenix-az", name: "Phoenix-Mesa-Chandler", state: "AZ", city: "Phoenix" },
  { slug: "tucson-az", name: "Tucson", state: "AZ", city: "Tucson" },
  { slug: "las-vegas-nv", name: "Las Vegas", state: "NV", city: "Las Vegas" },
];

const PROVIDERS_PER_METRO = 20;
const CATEGORY_SLUG = "grease-trap-cleaning";

type ProviderRow = {
  business_name: string;
  phone: string;
  website_url: string;
  email_public: string;
  description: string;
  street: string;
  city: string;
  state: string;
  postal_code: string;
  category: string;
  metro_slug: string;
  is_published: string;
};

const HEADERS: Array<keyof ProviderRow> = [
  "business_name",
  "phone",
  "website_url",
  "email_public",
  "description",
  "street",
  "city",
  "state",
  "postal_code",
  "category",
  "metro_slug",
  "is_published",
];

function escapeCsv(value: string) {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function buildProviderRows(metro: MetroSeed): ProviderRow[] {
  const rows: ProviderRow[] = [];
  for (let i = 1; i <= PROVIDERS_PER_METRO; i += 1) {
    const indexLabel = String(i).padStart(2, "0");
    rows.push({
      business_name: `Demo ${metro.name} Grease Trap Cleaning ${indexLabel}`,
      phone: `555-01${indexLabel}`,
      website_url: `https://example.com/${metro.slug}/${indexLabel}`,
      email_public: "",
      description: `Seed demo provider for ${metro.name}.`,
      street: `${100 + i} ${metro.city} Ave`,
      city: metro.city,
      state: metro.state,
      postal_code: `9${String(1000 + i).padStart(4, "0")}`,
      category: CATEGORY_SLUG,
      metro_slug: metro.slug,
      is_published: "true",
    });
  }
  return rows;
}

function toCsv(rows: ProviderRow[]) {
  const headerLine = HEADERS.join(",");
  const dataLines = rows.map((row) =>
    HEADERS.map((header) => escapeCsv(String(row[header] ?? ""))).join(",")
  );
  return [headerLine, ...dataLines].join("\n");
}

async function main() {
  const outputDir = path.join(process.cwd(), "seed-csv");
  await mkdir(outputDir, { recursive: true });

  const combinedRows: ProviderRow[] = [];

  for (const metro of METROS) {
    const rows = buildProviderRows(metro);
    combinedRows.push(...rows);
    const csv = toCsv(rows);
    const outputPath = path.join(outputDir, `${metro.slug}.csv`);
    await writeFile(outputPath, csv, "utf8");
  }

  const combinedCsv = toCsv(combinedRows);
  await writeFile(path.join(outputDir, "all-metros.csv"), combinedCsv, "utf8");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
