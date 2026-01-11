# MVP Audit Report (Fogforge)

Date: 2025-01-11
Scope: `apps/web` (Next.js App Router + Supabase SSR)

## Summary
- ✅ 30
- ⚠️ 6
- ❌ 0

## A. Platform Stability
1. ⚠️ npm run lint passes
   - Not executed here: `npm` not available in sandbox (`zsh: command not found: npm`).
2. ⚠️ npm run build passes
   - Not executed here: `npm` not available in sandbox (`zsh: command not found: npm`).
3. ✅ Vercel build assumptions
   - `apps/web/package.json` uses `next build` for build and `next start` for runtime.
4. ⚠️ Key routes compile (/ , /login, /dashboard, /admin, /get-started)
   - Route files exist under `apps/web/app`, but build was not run in this environment.

## B. Auth & Roles
5. ✅ Sign-in flow exists
   - `apps/web/app/login/page.tsx` uses `supabase.auth.signInWithPassword`.
6. ✅ Sign-out flow exists
   - `apps/web/app/logout/route.ts` handles POST/GET and clears cookies.
7. ✅ Route protection in place
   - Admin: `apps/web/app/admin/layout.tsx` (redirects unauthenticated/non-admin).
   - Provider: `apps/web/app/dashboard/layout.tsx` (redirects unauthenticated/non-provider).
8. ✅ Admin role check exists
   - `apps/web/app/admin/layout.tsx`, `apps/web/lib/auth/getUserContext.ts`.
9. ✅ Non-admin blocked from admin routes
   - Admin layout redirects to `/login` or `/`.

## C. Public Directory
10. ✅ /grease-trap-cleaning exists
    - `apps/web/app/(public)/grease-trap-cleaning/page.tsx`
11. ✅ /grease-trap-cleaning/[state]/[metro] exists
    - `apps/web/app/(public)/grease-trap-cleaning/[state]/[metro]/page.tsx`
12. ✅ /grease-trap-cleaning/[state]/[metro]/[provider] exists
    - `apps/web/app/(public)/grease-trap-cleaning/[state]/[metro]/[provider]/page.tsx`
13. ✅ Lead form action exists and writes
    - `apps/web/app/(public)/grease-trap-cleaning/[state]/[metro]/[provider]/actions.ts` inserts into `public.leads`.
14. ✅ Validation exists
    - Required fields checked in submitLeadAction before insert.
15. ✅ Confirmation UX exists
    - `apps/web/app/(public)/grease-trap-cleaning/[state]/[metro]/[provider]/LeadForm.tsx` shows success/error alert.

## D. Admin Panel
16. ✅ Admin shell/sidebar exists
    - `apps/web/app/admin/layout.tsx` + `apps/web/components/admin/AdminSidebar.tsx`.
17. ✅ Leads page loads and queries data
    - `apps/web/app/admin/leads/page.tsx` queries `public.leads` + `lead_deliveries`.
18. ✅ Providers page loads and queries data
    - `apps/web/app/admin/providers/page.tsx` queries `public.providers`.
19. ⚠️ Publish/unpublish controls
    - No explicit publish/unpublish actions found on providers page.
20. ✅ Import page exists and parses CSV
    - `apps/web/app/admin/import/providers/page.tsx` + `ImportClient.tsx`.
21. ✅ Import handles row errors
    - `ImportClient.tsx` aggregates per-row errors.
22. ✅ Admin onboarding page exists
    - `apps/web/app/admin/onboarding/page.tsx` contains approve/reject server actions.

## E. Provider Onboarding Flow
23. ✅ Provider can start onboarding/claim
    - `/get-started` and `/onboarding` flows exist.
24. ✅ Request stored
    - `apps/web/app/onboarding/OnboardingFlow.tsx` inserts into `public.onboarding_requests`.
25. ✅ Admin approve flow exists
    - `apps/web/app/admin/onboarding/page.tsx` approve action.
26. ✅ Admin reject flow exists
    - `apps/web/app/admin/onboarding/page.tsx` reject action.
27. ✅ Status reflects correctly
    - `apps/web/app/onboarding/status/page.tsx` shows latest status.

## F. UX Baseline
28. ✅ No dead links in core flows
    - Checked core header links and admin links; `/account` route exists under `apps/web/app/account`.
29. ⚠️ Loading states on major pages
    - Some pages have empty/error states, but explicit loading states are not consistently present.
30. ✅ Empty states exist
    - Several list pages (providers, activity, metros) render empty-state messages.

## G. Data Safety / Guardrails
31. ✅ Admin-only actions protected server-side
    - `apps/web/app/admin/import/providers/actions.ts` checks admin; admin layouts gate access.
32. ✅ No secrets in client bundles
    - Client uses `NEXT_PUBLIC_*` vars; server actions use non-public envs (e.g., Resend).
33. ✅ RLS expectations documented in code
    - Server uses SSR client + RLS (`createServerSupabaseReadOnly`); import uses RLS client with access token.

## H. Operational Readiness
34. ✅ Env vars documented
    - `apps/web/.env.example` includes Supabase + Resend vars.
35. ⚠️ Fresh clone instructions
    - No README found at repo root; `DEPLOY_VERCEL.md` exists.
36. ✅ Vercel config
    - Standard Next build/start scripts; `DEPLOY_VERCEL.md` provides guidance.

## Ship Blockers
- None identified in code. Note: lint/build not executed in this environment because `npm` is unavailable.

## Post‑MVP Polish
- Add explicit publish/unpublish controls in admin providers.
- Add consistent loading states for major list pages.
- Add a minimal README with local setup steps.

## Exact Next Steps
1. Run from `apps/web`: `npm install`, `npm run lint`, `npm run build`.
2. Verify /admin publish/unpublish expectations with product requirements.
3. Add minimal README (local setup + env vars) if desired.

## Notes on TODO/FIXME/Errors
- `apps/web/scripts/generate-seed-csvs.ts` contains a `console.error` for script failures.
