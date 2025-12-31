export type MetroOption = {
  id?: string;
  name: string;
  slug: string;
  state: string;
};

const STATE_NAMES: Record<string, string> = {
  AL: "alabama",
  AK: "alaska",
  AZ: "arizona",
  AR: "arkansas",
  CA: "california",
  CO: "colorado",
  CT: "connecticut",
  DE: "delaware",
  FL: "florida",
  GA: "georgia",
  HI: "hawaii",
  ID: "idaho",
  IL: "illinois",
  IN: "indiana",
  IA: "iowa",
  KS: "kansas",
  KY: "kentucky",
  LA: "louisiana",
  ME: "maine",
  MD: "maryland",
  MA: "massachusetts",
  MI: "michigan",
  MN: "minnesota",
  MS: "mississippi",
  MO: "missouri",
  MT: "montana",
  NE: "nebraska",
  NV: "nevada",
  NH: "new hampshire",
  NJ: "new jersey",
  NM: "new mexico",
  NY: "new york",
  NC: "north carolina",
  ND: "north dakota",
  OH: "ohio",
  OK: "oklahoma",
  OR: "oregon",
  PA: "pennsylvania",
  RI: "rhode island",
  SC: "south carolina",
  SD: "south dakota",
  TN: "tennessee",
  TX: "texas",
  UT: "utah",
  VT: "vermont",
  VA: "virginia",
  WA: "washington",
  WV: "west virginia",
  WI: "wisconsin",
  WY: "wyoming",
};

export function normalizeQuery(value: string) {
  return value.trim().toLowerCase();
}

export function getStateMatches(query: string) {
  const normalized = normalizeQuery(query);
  if (!normalized) {
    return [];
  }

  const matches = new Set<string>();
  const upper = normalized.toUpperCase();
  if (STATE_NAMES[upper]) {
    matches.add(upper);
  }

  Object.entries(STATE_NAMES).forEach(([code, name]) => {
    if (name === normalized || name.startsWith(normalized)) {
      matches.add(code);
    }
  });

  return Array.from(matches);
}

function levenshtein(a: string, b: string) {
  if (a === b) return 0;
  if (!a || !b) return Math.max(a.length, b.length);

  const matrix = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
}

function scoreMetro(metro: MetroOption, query: string, stateMatches: string[]) {
  const normalized = normalizeQuery(query);
  if (!normalized) return 0;

  const name = normalizeQuery(metro.name);
  const slug = normalizeQuery(metro.slug);
  let score = 0;

  if (name === normalized) score += 100;
  if (name.startsWith(normalized)) score += 80;
  if (name.includes(normalized)) score += 60;
  if (slug.includes(normalized)) score += 30;
  if (stateMatches.includes(metro.state)) score += 50;

  const distance = levenshtein(normalized, name);
  score += Math.max(0, 40 - distance * 6);

  return score;
}

export function filterMetros(metros: MetroOption[], query: string, stateFilter: string) {
  const normalized = normalizeQuery(query);
  const stateMatches = getStateMatches(query);

  return metros.filter((metro) => {
    const matchesState = stateFilter === "all" ? true : metro.state === stateFilter;
    if (!matchesState) return false;

    if (!normalized) return true;
    const name = normalizeQuery(metro.name);
    const slug = normalizeQuery(metro.slug);
    return (
      name.includes(normalized) ||
      slug.includes(normalized) ||
      stateMatches.includes(metro.state)
    );
  });
}

export function getMetroSuggestions(metros: MetroOption[], query: string, limit = 6) {
  const stateMatches = getStateMatches(query);
  const scored = metros
    .map((metro) => ({
      metro,
      score: scoreMetro(metro, query, stateMatches),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.metro.name.localeCompare(b.metro.name))
    .slice(0, limit)
    .map((entry) => entry.metro);

  return scored;
}
