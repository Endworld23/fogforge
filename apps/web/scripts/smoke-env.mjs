/* global process, console */
const checks = [
  "RESEND_API_KEY",
  "LEADS_FROM_EMAIL",
  "LEADS_BCC_EMAIL",
  "LEADS_FALLBACK_EMAIL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
];

const missing = checks.filter((key) => !process.env[key]);

if (missing.length === 0) {
  console.log("Env check: all expected vars are set.");
} else {
  console.log("Env check: missing vars (set in apps/web/.env.local or your environment):");
  for (const key of missing) {
    console.log(`- ${key}`);
  }
}
