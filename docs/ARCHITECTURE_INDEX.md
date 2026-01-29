# Architecture Index (FogForge)
Note: This document is a cross-reference; REPO_MAP.md is narrative (if present).

## Table of Contents
- [1) Overview](#1-overview)
- [2) Route-to-Implementation Map](#2-route-to-implementation-map)
- [3) Server Actions & Libraries Index](#3-server-actions--libraries-index)
- [4) Data Model Index (Operational)](#4-data-model-index-operational)
- [5) Integrations Index](#5-integrations-index)
- [6) Known Gaps / Placeholders](#6-known-gaps--placeholders)
- [How to update this document](#how-to-update-this-document)

## 1) Overview
FogForge is a Next.js App Router app that serves a public directory for grease-trap cleaning providers, collects quote requests (leads), supports onboarding and claims, and provides provider/admin dashboards. It uses Supabase for data, RLS policies, and storage, with email delivery via Resend. Core routing is in `apps/web/app/**`, data access and guards in `apps/web/lib/**`, and schema/policies in `supabase/migrations/**`.

---

## 2) Route-to-Implementation Map

### A) Public directory + request-quote routes
| Route | Guard | Page file | Key components | Server actions / handlers called | Tables/RPCs touched | Storage buckets | Env vars used |
|---|---|---|---|---|---|---|---|
| `/` | none | `apps/web/app/page.tsx` | `apps/web/components/site/MetroSearch.tsx`, `apps/web/components/ui/button.tsx`, `apps/web/components/ui/card.tsx`, `apps/web/components/ui/separator.tsx` | not found | not found | not found | not found |
| `/grease-trap-cleaning` | none | `apps/web/app/(public)/grease-trap-cleaning/page.tsx` | `apps/web/app/(public)/grease-trap-cleaning/MetroDirectoryClient.tsx` | not found | `metros` (read) | not found | `NEXT_PUBLIC_SITE_URL`, `VERCEL_URL` via `apps/web/lib/seo.ts` |
| `/grease-trap-cleaning/[state]/[metro]` | none | `apps/web/app/(public)/grease-trap-cleaning/[state]/[metro]/page.tsx` | `apps/web/app/(public)/grease-trap-cleaning/[state]/[metro]/ProvidersGrid.tsx` | not found | `metros`, `categories`, `providers` (read) | not found | `NEXT_PUBLIC_SITE_URL`, `VERCEL_URL` via `apps/web/lib/seo.ts` |
| `/grease-trap-cleaning/[state]/[metro]/[provider]` | none | `apps/web/app/(public)/grease-trap-cleaning/[state]/[metro]/[provider]/page.tsx` | `apps/web/components/ui/breadcrumb.tsx`, `apps/web/components/ui/badge.tsx`, `apps/web/components/ui/button.tsx`, `apps/web/components/ui/card.tsx`, `apps/web/components/ui/separator.tsx` | not found | `providers`, `metros`, `categories`, `provider_media` (read) | not found | `NEXT_PUBLIC_SITE_URL`, `VERCEL_URL` via `apps/web/lib/seo.ts` |
| `/grease-trap-cleaning/[state]/[metro]/request-quote` | none | `apps/web/app/(public)/grease-trap-cleaning/[state]/[metro]/request-quote/page.tsx` | `apps/web/app/request-quote/QuoteRequestForm.tsx` | `apps/web/app/request-quote/actions.ts` | `metros`, `categories` (read); `leads` (write via action); RPC `record_lead_submit_attempt` (write via action); `leads`/`lead_events` (write via action/lib) | not found | `RESEND_API_KEY`, `LEADS_FROM_EMAIL`, `LEADS_BCC_EMAIL`, `LEADS_FALLBACK_EMAIL` via `apps/web/lib/leads/*` |
| `/grease-trap-cleaning/[state]/[metro]/[provider]/request-quote` | none | `apps/web/app/(public)/grease-trap-cleaning/[state]/[metro]/[provider]/request-quote/page.tsx` | `apps/web/app/request-quote/QuoteRequestForm.tsx` | `apps/web/app/request-quote/actions.ts` | `providers`, `metros`, `categories` (read); `leads` (write via action); RPC `record_lead_submit_attempt`; `leads`/`lead_events` (write via action/lib) | not found | `RESEND_API_KEY`, `LEADS_FROM_EMAIL`, `LEADS_BCC_EMAIL`, `LEADS_FALLBACK_EMAIL` via `apps/web/lib/leads/*` |
| `/request-quote` | none | `apps/web/app/request-quote/page.tsx` | `apps/web/app/request-quote/QuoteRequestForm.tsx` | `apps/web/app/request-quote/actions.ts` | `metros`, `categories` (read); `leads` (write via action); RPC `record_lead_submit_attempt`; `leads`/`lead_events` (write via action/lib) | not found | `RESEND_API_KEY`, `LEADS_FROM_EMAIL`, `LEADS_BCC_EMAIL`, `LEADS_FALLBACK_EMAIL` via `apps/web/lib/leads/*` |

### B) Claim + onboarding routes
| Route | Guard | Page file | Key components | Server actions / handlers called | Tables/RPCs touched | Storage buckets | Env vars used |
|---|---|---|---|---|---|---|---|
| `/get-started` | none | `apps/web/app/get-started/page.tsx` | `apps/web/components/ui/badge.tsx`, `apps/web/components/ui/button.tsx`, `apps/web/components/ui/card.tsx`, `apps/web/components/ui/input.tsx` | not found | not found | not found | not found |
| `/onboarding` | auth | `apps/web/app/onboarding/page.tsx` | `apps/web/app/onboarding/OnboardingFlow.tsx` | not found | `claimable_providers`, `metros` (read); `onboarding_requests` (write in client) | `onboarding-docs` (upload in client) | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` via `apps/web/lib/supabase/browser.ts` |
| `/onboarding/status` | auth | `apps/web/app/onboarding/status/page.tsx` | not found | not found | `onboarding_requests` (read) | not found | not found |
| `/claim?provider=...` | auth | `apps/web/app/claim/page.tsx` | `apps/web/app/claim/ClaimForm.tsx` | `apps/web/app/claim/actions.ts` | `providers` (read); `provider_claim_requests`, `provider_claim_request_documents` (write via action) | `claim-documents` (upload in client) | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` via `apps/web/lib/supabase/browser.ts` |

### C) Provider dashboard routes
| Route | Guard | Page file | Key components | Server actions / handlers called | Tables/RPCs touched | Storage buckets | Env vars used |
|---|---|---|---|---|---|---|---|
| `/dashboard` | provider_user | `apps/web/app/dashboard/page.tsx` | not found | not found | `providers` (read) | not found | not found |
| `/dashboard/leads` | provider_user | `apps/web/app/dashboard/leads/page.tsx` | `apps/web/app/dashboard/leads/LeadsTable.tsx` | `apps/web/app/dashboard/leads/actions.ts` | `leads` (read/write), `provider_users` (read), `lead_events` (write via RPC) | not found | not found |
| `/dashboard/leads/board` | provider_user | `apps/web/app/dashboard/leads/board/page.tsx` | `apps/web/components/leads/LeadsBoard.tsx` | `apps/web/app/dashboard/leads/actions.ts` | `leads` (read/write), `provider_users` (read), `lead_events` (write via RPC) | not found | not found |
| `/dashboard/leads/[id]` | provider_user | `apps/web/app/dashboard/leads/[id]/page.tsx` | `apps/web/app/dashboard/leads/[id]/LeadDetailActions.tsx` | `apps/web/app/dashboard/leads/actions.ts` | `leads`, `lead_events` (read/write), `provider_users` (read) | not found | not found |
| `/dashboard/profile` | provider_user | `apps/web/app/dashboard/profile/page.tsx` | `apps/web/app/dashboard/profile/ProfileForm.tsx`, `apps/web/app/dashboard/profile/ProviderMediaManager.tsx` | `apps/web/app/dashboard/profile/actions.ts` | `providers` (read/write), `provider_media` (read/write), `admins` (read), `provider_users` (read) | `provider-logos`, `provider-photos` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` via `apps/web/lib/supabase/browser.ts` |

### D) Admin routes (includes /admin/claims/[id])
| Route | Guard | Page file | Key components | Server actions / handlers called | Tables/RPCs touched | Storage buckets | Env vars used |
|---|---|---|---|---|---|---|---|
| `/admin` | admin | `apps/web/app/admin/page.tsx` | `apps/web/components/admin/AdminPageHeader.tsx` | not found | `leads`, `providers`, `onboarding_requests` (read) | not found | not found |
| `/admin/claims` | admin | `apps/web/app/admin/claims/page.tsx` | `apps/web/app/admin/claims/ClaimsTable.tsx` | `apps/web/app/admin/claims/actions.ts` | `provider_claim_requests`, `provider_claim_request_documents`, `providers` (read/write) | not found | `RESEND_API_KEY`, `LEADS_FROM_EMAIL` via `apps/web/lib/claims/sendClaimNotification.ts` |
| `/admin/claims/[id]` | admin | `apps/web/app/admin/claims/[id]/page.tsx` | `apps/web/app/admin/claims/[id]/ClaimReviewClient.tsx` | `apps/web/app/admin/claims/actions.ts`, `apps/web/app/admin/providers/actions.ts` | `provider_claim_requests`, `provider_claim_request_documents`, `providers` (read/write) | not found | `RESEND_API_KEY`, `LEADS_FROM_EMAIL` via `apps/web/lib/claims/sendClaimNotification.ts` |
| `/admin/leads` | admin | `apps/web/app/admin/leads/page.tsx` | `apps/web/app/admin/leads/LeadsTable.tsx`, `apps/web/app/admin/leads/CreateTestLeadDialog.tsx` | `apps/web/app/admin/leads/actions.ts` | `leads`, `providers` (read/write) | not found | `RESEND_API_KEY`, `LEADS_FROM_EMAIL`, `LEADS_BCC_EMAIL`, `LEADS_FALLBACK_EMAIL` (warnings) |
| `/admin/leads/board` | admin | `apps/web/app/admin/leads/board/page.tsx` | `apps/web/components/leads/LeadsBoard.tsx` | `apps/web/app/admin/leads/actions.ts` | `leads`, `providers` (read/write) | not found | not found |
| `/admin/leads/[id]` | admin | `apps/web/app/admin/leads/[id]/page.tsx` | `apps/web/app/admin/leads/[id]/LeadDetailActions.tsx` | `apps/web/app/admin/leads/actions.ts` | `leads`, `lead_events`, `providers` (read/write) | not found | not found |
| `/admin/providers` | admin | `apps/web/app/admin/providers/page.tsx` | `apps/web/app/admin/providers/ProvidersTable.tsx` | `apps/web/app/admin/providers/actions.ts` | `providers` (read/write) | not found | not found |
| `/admin/providers/[slug]` | admin | `apps/web/app/admin/providers/[slug]/page.tsx` | `apps/web/app/admin/providers/[slug]/ProviderActions.tsx` | `apps/web/app/admin/providers/actions.ts` | `providers` (read/write) | not found | not found |
| `/admin/routing` | admin | `apps/web/app/admin/routing/page.tsx` | `apps/web/app/admin/routing/MetroRoutingTable.tsx` | not found | `metros`, `providers`, `metro_lead_rotation`, `leads` (read) | not found | not found |
| `/admin/onboarding` | admin | `apps/web/app/admin/onboarding/page.tsx` | not found | inline server actions in page | `onboarding_requests`, `onboarding_documents`, `providers`, `categories`, `business_claims`, `provider_users` (read/write) | `onboarding-docs` (signed URL read) | not found |
| `/admin/import/providers` | admin | `apps/web/app/admin/import/providers/page.tsx` | `apps/web/app/admin/import/providers/ImportClient.tsx` | `apps/web/app/admin/import/providers/actions.ts` | `providers`, `metros`, `categories`, `admins` (read/write) | not found | `SUPABASE_URL`, `SUPABASE_ANON_KEY` |
| `/admin/activity` | admin | `apps/web/app/admin/activity/page.tsx` | not found | not found | `providers` (read) | not found | not found |

### E) System route handlers
| Route | Guard | Page file | Key components | Server actions / handlers called | Tables/RPCs touched | Storage buckets | Env vars used |
|---|---|---|---|---|---|---|---|
| `/api/metros` | none | `apps/web/app/api/metros/route.ts` | not found | route handler | `metros` (read) | not found | not found |
| `/healthz` | none | `apps/web/app/healthz/route.ts` | not found | route handler | not found | not found | not found |
| `/robots.txt` | none | `apps/web/app/robots.txt/route.ts` | not found | route handler | not found | not found | `NEXT_PUBLIC_SITE_URL`, `VERCEL_URL` via `apps/web/lib/seo.ts` |
| `/sitemap.xml` | none | `apps/web/app/sitemap.xml/route.ts` | not found | route handler | `metros`, `providers` (read) | not found | `NEXT_PUBLIC_SITE_URL`, `VERCEL_URL` via `apps/web/lib/seo.ts` |
| `/logout` (GET/POST) | none | `apps/web/app/logout/route.ts` | not found | route handler | not found | not found | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

Guard references: admin = `apps/web/app/admin/layout.tsx` + `apps/web/lib/auth/isAdminServer.ts`; provider_user = `apps/web/app/dashboard/layout.tsx` + `apps/web/lib/auth/getUserContext.ts`; auth = `apps/web/lib/auth/getUserContext.ts`.

---

## 3) Server Actions & Libraries Index

### Server action files (apps/web/app/**/actions.ts)
- `apps/web/app/(public)/grease-trap-cleaning/[state]/[metro]/[provider]/actions.ts`
  - Exports: `submitLeadAction`
  - Reads: `metros`, `providers`
  - Writes: `leads` (insert/update), `lead_events` (RPC), RPC `record_lead_submit_attempt`
  - Buckets: not found
  - Env vars: `RESEND_API_KEY`, `LEADS_FROM_EMAIL`, `LEADS_BCC_EMAIL`, `LEADS_FALLBACK_EMAIL` via `apps/web/lib/leads/*`
- `apps/web/app/request-quote/actions.ts`
  - Exports: `submitQuoteRequestAction`
  - Reads: `metros`, `categories`, `providers`
  - Writes: `leads`, `lead_events` (RPC), RPC `record_lead_submit_attempt`
  - Buckets: not found
  - Env vars: `RESEND_API_KEY`, `LEADS_FROM_EMAIL`, `LEADS_BCC_EMAIL`, `LEADS_FALLBACK_EMAIL` via `apps/web/lib/leads/*`
- `apps/web/app/claim/actions.ts`
  - Exports: `submitProviderClaimAction`
  - Reads: `providers`, `provider_claim_requests`
  - Writes: `provider_claim_requests`, `provider_claim_request_documents`
  - Buckets: `claim-documents` (upload done in client `apps/web/app/claim/ClaimForm.tsx`)
  - Env vars: `RESEND_API_KEY`, `LEADS_FROM_EMAIL` via `apps/web/lib/claims/sendClaimNotification.ts`
- `apps/web/app/admin/claims/actions.ts`
  - Exports: `approveClaimRequestAction`, `rejectClaimRequestAction`, `verifyProviderFromClaimAction`
  - Reads: `provider_claim_requests`, `providers`
  - Writes: `provider_claim_requests`, `providers`, `provider_users`
  - Buckets: not found
  - Env vars: `RESEND_API_KEY`, `LEADS_FROM_EMAIL` via `apps/web/lib/claims/sendClaimNotification.ts`
- `apps/web/app/admin/providers/actions.ts`
  - Exports: `updateProviderPublishAction`
  - Reads: `providers`
  - Writes: `providers`
  - Env vars: not found
- `apps/web/app/admin/leads/actions.ts`
  - Exports: `markLeadSentAction`, `resendLeadAction`, `createTestLeadAction`, `markLeadViewedAction`, `markLeadContactedAction`, `setLeadResolvedAction`, `setLeadEscalatedAction`, `setFollowUpAction`, `assignLeadToProviderAction`, `returnLeadToPoolAction`, `markLeadDeliveryPendingAction`
  - Reads: `leads`, `providers`, `metro_lead_rotation`
  - Writes: `leads`, `lead_events` (RPC)
  - Env vars: `RESEND_API_KEY`, `LEADS_FROM_EMAIL`, `LEADS_BCC_EMAIL`, `LEADS_FALLBACK_EMAIL` via `apps/web/lib/leads/deliverLead.ts`
- `apps/web/app/dashboard/leads/actions.ts`
  - Exports: `markLeadViewedProviderAction`, `moveLeadStageProviderAction`, `declineLeadProviderAction`, `markLeadContactedProviderAction`, `setLeadResolvedProviderAction`, `setLeadFollowUpProviderAction`
  - Reads: `leads`, `provider_users`
  - Writes: `leads`, `lead_events` (RPC)
  - Env vars: not found
- `apps/web/app/dashboard/profile/actions.ts`
  - Exports: `updateProviderProfileAction`
  - Reads: `admins`, `provider_users`, `providers`
  - Writes: `providers`
  - Env vars: not found
- `apps/web/app/admin/import/providers/actions.ts`
  - Exports: `importProvidersFromCsv`
  - Reads: `providers`, `metros`, `categories`, `admins`
  - Writes: `providers`
  - Env vars: `SUPABASE_URL`, `SUPABASE_ANON_KEY`

### Key libraries (apps/web/lib)
- `apps/web/lib/supabase/server.ts` — server Supabase client (uses `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
- `apps/web/lib/supabase/browser.ts` — browser Supabase client (uses `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
- `apps/web/lib/supabase/storageUrl.ts` — builds public storage URLs (uses `NEXT_PUBLIC_SUPABASE_URL`).
- `apps/web/lib/auth/getUserContext.ts` — auth context + admin/provider lookup (`admins`, `provider_users`).
- `apps/web/lib/auth/isAdminServer.ts` — admin guard (`admins`).
- `apps/web/lib/providers/providerState.ts` — derives provider state from `claim_status`, `verified_at`, `is_claimed`, `claimed_by_user_id`, `user_id`.
- `apps/web/lib/leads/assignMetroPoolLead.ts` — assigns pooled leads (`providers`, `leads`, `metro_lead_rotation`).
- `apps/web/lib/leads/deliverLead.ts` — email delivery via Resend (`leads`, `providers`, `metros`, `categories`).
- `apps/web/lib/leads/recordLeadEvent.ts` — RPC `record_lead_event`.
- `apps/web/lib/leads/sendRequesterConfirmation.ts` — Resend confirmation email.
- `apps/web/lib/claims/sendClaimNotification.ts` — Resend claim notification email.

---

## 4) Data Model Index (Operational)

### Tables / Views
- `admins`
  - Purpose: admin authorization
  - Key columns used: `user_id`
  - Read paths: `/admin/*` via `apps/web/lib/auth/isAdminServer.ts`, `apps/web/lib/auth/getUserContext.ts`
  - Write paths: not found
  - Migrations: `supabase/migrations/20250101002000_admin_bootstrap_fix.sql`
  - RLS: admin policies in same migration

- `provider_users`
  - Purpose: link users to providers (dashboard access)
  - Key columns used: `user_id`, `provider_id`
  - Read paths: `/dashboard/*` via `apps/web/lib/auth/getUserContext.ts`, `apps/web/app/dashboard/leads/actions.ts`
  - Write paths: `apps/web/app/admin/claims/actions.ts`, `apps/web/app/admin/onboarding/page.tsx`
  - Migrations: `supabase/migrations/20250101004000_provider_users.sql`
  - RLS: provider/user policies in same migration

- `providers`
  - Purpose: provider listings
  - Key columns used: `id`, `slug`, `business_name`, `city`, `state`, `street`, `postal_code`, `phone`, `email_public`, `website_url`, `description`, `metro_id`, `category_id`, `status`, `is_published`, `is_claimed`, `user_id`, `claim_status`, `verified_at`, `claimed_by_user_id`, `logo_url`, `logo_path`
  - Read paths: public directory (`apps/web/app/(public)/grease-trap-cleaning/**`), dashboards (`apps/web/app/dashboard/**`), admin (`apps/web/app/admin/**`)
  - Write paths: `apps/web/app/admin/claims/actions.ts`, `apps/web/app/admin/providers/actions.ts`, `apps/web/app/admin/onboarding/page.tsx`, `apps/web/app/dashboard/profile/actions.ts`, `apps/web/app/dashboard/profile/ProviderMediaManager.tsx`
  - Migrations: `supabase/migrations/20250101000000_init_fogforge_schema.sql`, `supabase/migrations/20260120000000_provider_claim_status.sql`, `supabase/migrations/20260127090000_provider_media.sql`
  - RLS: base policies in init migration; provider-user updates in `supabase/migrations/20250101004000_provider_users.sql`

- `metros`
  - Purpose: metro directory
  - Key columns used: `id`, `name`, `slug`, `state`
  - Read paths: `/grease-trap-cleaning*`, `/request-quote*`, `/api/metros`, `/sitemap.xml`
  - Write paths: admin import (`apps/web/app/admin/import/providers/actions.ts`)
  - Migrations: `supabase/migrations/20250101000000_init_fogforge_schema.sql`
  - RLS: public read/admin policies in init migration

- `categories`
  - Purpose: service categories
  - Key columns used: `id`, `slug`, `name`
  - Read paths: `/grease-trap-cleaning*`, `/request-quote*`
  - Write paths: admin import (`apps/web/app/admin/import/providers/actions.ts`)
  - Migrations: `supabase/migrations/20250101000000_init_fogforge_schema.sql`
  - RLS: public read/admin policies in init migration

- `leads`
  - Purpose: quote requests
  - Key columns used: `id`, `created_at`, `provider_id`, `metro_id`, `category_id`, `name`, `email`, `phone`, `message`, `source_url`, `status`, `delivery_status`, `delivered_at`, `delivery_error`, `requester_first_name`, `requester_last_name`, `requester_business_name`, `requester_address`, `viewed_at`, `last_contacted_at`, `resolved_at`, `resolution_status`, `escalated_at`, `escalation_reason`, `follow_up_at`, `next_action`, `declined_at`, `decline_reason`, `declined_by_provider_id`
  - Read paths: `/admin/leads*`, `/dashboard/leads*`
  - Write paths: `apps/web/app/(public)/grease-trap-cleaning/[state]/[metro]/[provider]/actions.ts`, `apps/web/app/request-quote/actions.ts`, `apps/web/app/admin/leads/actions.ts`, `apps/web/app/dashboard/leads/actions.ts`, `apps/web/lib/leads/deliverLead.ts`, `apps/web/lib/leads/assignMetroPoolLead.ts`
  - Migrations: `supabase/migrations/20250101000000_init_fogforge_schema.sql`, `supabase/migrations/20260108040210_lead_delivery_status.sql`, `supabase/migrations/20260120090000_lead_lifecycle_fields.sql`, `supabase/migrations/20260122030000_lead_requester_fields.sql`, `supabase/migrations/20260122040000_public_insert_leads_policy.sql`
  - RLS: policies in init + public insert migration

- `lead_events`
  - Purpose: lead timeline
  - Key columns used: `id`, `lead_id`, `actor_type`, `event_type`, `data`, `created_at`
  - Read paths: `/admin/leads/[id]`, `/dashboard/leads/[id]`
  - Write paths: `apps/web/lib/leads/recordLeadEvent.ts`
  - Migrations: `supabase/migrations/20260124001000_ops_hardening.sql`
  - RLS: admin/provider policies in same migration

- `metro_lead_rotation`
  - Purpose: round-robin pool assignment
  - Key columns used: `metro_id`, `last_provider_id`, `last_assigned_at`, `updated_at`
  - Read paths: `/admin/routing` (`apps/web/app/admin/routing/page.tsx`)
  - Write paths: `apps/web/lib/leads/assignMetroPoolLead.ts`
  - Migrations: `supabase/migrations/20260124000000_metro_lead_rotation.sql`
  - RLS: not found

- `provider_media`
  - Purpose: provider gallery
  - Key columns used: `id`, `provider_id`, `url`, `sort_order`, `created_at`
  - Read paths: public provider page (`apps/web/app/(public)/grease-trap-cleaning/[state]/[metro]/[provider]/page.tsx`), dashboard profile (`apps/web/app/dashboard/profile/page.tsx`)
  - Write paths: `apps/web/app/dashboard/profile/ProviderMediaManager.tsx`
  - Migrations: `supabase/migrations/20260127090000_provider_media.sql`, `supabase/migrations/20260127112000_provider_media_public_read_verified.sql`
  - RLS: public read + provider/admin policies in migrations above

- `provider_claim_requests`
  - Purpose: claim submissions
  - Key columns used: `id`, `provider_id`, `requester_user_id`, `requester_email`, `status`, `message`, `created_at`, `reviewed_at`, `reviewed_by`, `claimant_*`
  - Read paths: `/admin/claims`, `/admin/claims/[id]`
  - Write paths: `apps/web/app/claim/actions.ts`, `apps/web/app/admin/claims/actions.ts`
  - Migrations: `supabase/migrations/20260127100000_provider_claim_requests.sql`, `supabase/migrations/20260127111000_claim_request_details.sql`
  - RLS: requester/admin policies in `20260127100000_provider_claim_requests.sql`

- `provider_claim_request_documents`
  - Purpose: claim document metadata
  - Key columns used: `id`, `claim_request_id`, `doc_type`, `file_path`, `file_url`
  - Read paths: `/admin/claims`, `/admin/claims/[id]`
  - Write paths: `apps/web/app/claim/actions.ts`
  - Migrations: `supabase/migrations/20260127111000_claim_request_details.sql`
  - RLS: requester/admin policies in same migration

- `onboarding_requests`
  - Purpose: onboarding submissions (claim/list)
  - Key columns used: `id`, `type`, `status`, `email`, `full_name`, `phone`, `role_title`, `notes`, `business_id`, `business_name`, `city`, `state`, `metro_id`, `created_at`, `rejection_reason`, `reviewed_at`, `reviewed_by`, `user_id`
  - Read paths: `/admin/onboarding`, `/onboarding/status`
  - Write paths: `apps/web/app/onboarding/OnboardingFlow.tsx`, `apps/web/app/onboarding/ClaimOnboardingForm.tsx`, `apps/web/app/onboarding/ListOnboardingForm.tsx`, `apps/web/app/admin/onboarding/page.tsx`
  - Migrations: `supabase/migrations/20250101005000_onboarding_claims.sql`
  - RLS: policies in same migration

- `onboarding_documents`
  - Purpose: onboarding documents
  - Key columns used: `onboarding_request_id`, `storage_path`, `file_name`
  - Read paths: `/admin/onboarding`
  - Write paths: `apps/web/app/onboarding/OnboardingFlow.tsx`, `apps/web/app/onboarding/ClaimOnboardingForm.tsx`, `apps/web/app/onboarding/ListOnboardingForm.tsx`
  - Migrations: `supabase/migrations/20250101005000_onboarding_claims.sql`
  - RLS: policies in same migration

- `business_claims`
  - Purpose: approved claim records
  - Key columns used: `business_id`, `user_id`
  - Read/write paths: `apps/web/app/admin/onboarding/page.tsx`
  - Migrations: `supabase/migrations/20250101005000_onboarding_claims.sql`
  - RLS: policies in same migration

- `claimable_providers` (view)
  - Purpose: claimable provider list for onboarding
  - Key columns used: `id`, `business_name`, `city`, `state`
  - Read paths: `/onboarding`
  - Write paths: not found
  - Migrations: `supabase/migrations/20250101006000_claimable_providers_view.sql`
  - RLS: not found

### RPCs
- `record_lead_submit_attempt`
  - Purpose: rate-limit lead submits
  - Read/write paths: `apps/web/app/(public)/grease-trap-cleaning/[state]/[metro]/[provider]/actions.ts`, `apps/web/app/request-quote/actions.ts`
  - Migration: not found
- `record_lead_event`
  - Purpose: append lead event timeline
  - Read/write paths: `apps/web/lib/leads/recordLeadEvent.ts`
  - Migration: not found

---

## 5) Integrations Index

### Resend (Email)
- Lead delivery: `apps/web/lib/leads/deliverLead.ts` (triggered from lead actions)
- Requester confirmation: `apps/web/lib/leads/sendRequesterConfirmation.ts` (triggered from lead actions)
- Claim notifications: `apps/web/lib/claims/sendClaimNotification.ts` (triggered from claim actions)

### Env vars
- `RESEND_API_KEY`, `LEADS_FROM_EMAIL` → required for email senders (`apps/web/lib/leads/deliverLead.ts`, `apps/web/lib/leads/sendRequesterConfirmation.ts`, `apps/web/lib/claims/sendClaimNotification.ts`). When missing, delivery is skipped with error message (`apps/web/lib/leads/deliverLead.ts`).
- `LEADS_BCC_EMAIL`, `LEADS_FALLBACK_EMAIL` → optional delivery configuration (`apps/web/lib/leads/deliverLead.ts`). Missing values are surfaced in admin leads page (`apps/web/app/admin/leads/page.tsx`).
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Supabase client config (`apps/web/lib/supabase/server.ts`, `apps/web/lib/supabase/browser.ts`, `apps/web/app/logout/route.ts`).
- `SUPABASE_URL`, `SUPABASE_ANON_KEY` → admin import (`apps/web/app/admin/import/providers/actions.ts`).
- `NEXT_PUBLIC_SITE_URL`, `VERCEL_URL` → SEO + sitemap/robots (`apps/web/lib/seo.ts`, `apps/web/app/sitemap.xml/route.ts`, `apps/web/app/robots.txt/route.ts`).

### Storage buckets
- `claim-documents`
  - Upload: `apps/web/app/claim/ClaimForm.tsx`
  - Read/display: `apps/web/app/admin/claims/page.tsx`, `apps/web/app/admin/claims/[id]/page.tsx` (via `file_url`)
  - Access pattern: signed URL (created in `apps/web/app/claim/ClaimForm.tsx`); policies in `supabase/migrations/20260127111000_claim_request_details.sql`
- `onboarding-docs`
  - Upload: `apps/web/app/onboarding/OnboardingFlow.tsx`, `apps/web/app/onboarding/ClaimOnboardingForm.tsx`, `apps/web/app/onboarding/ListOnboardingForm.tsx`
  - Read/display: `apps/web/app/admin/onboarding/page.tsx` (signed URLs)
  - Access pattern: signed URL; policies in `supabase/migrations/20250101005000_onboarding_claims.sql`
- `provider-logos`
  - Upload/delete: `apps/web/app/dashboard/profile/ProviderMediaManager.tsx`
  - Read/display: `apps/web/app/(public)/grease-trap-cleaning/[state]/[metro]/[provider]/page.tsx` (logo_url or public URL)
  - Access pattern: public URLs; policies in `supabase/migrations/20260124001000_ops_hardening.sql`
- `provider-photos`
  - Upload/delete: `apps/web/app/dashboard/profile/ProviderMediaManager.tsx`
  - Read/display: `apps/web/app/(public)/grease-trap-cleaning/[state]/[metro]/[provider]/page.tsx` via `provider_media`
  - Access pattern: public URLs; policies in `supabase/migrations/20260124001000_ops_hardening.sql`

---

## 6) Known Gaps / Placeholders
- `/admin/claims/[id]` is now implemented (route present in `apps/web/app/admin/claims/[id]/page.tsx`).
- Admin activity page is placeholder: `apps/web/app/admin/activity/page.tsx`.
- Account page is placeholder: `apps/web/app/account/page.tsx`.
- Support email placeholder in onboarding status: `apps/web/app/onboarding/status/page.tsx` (`SUPPORT_EMAIL = "support@YOURDOMAIN.com"`).
- Spec mismatch: per-metro provider states in docs vs single provider-level fields in code (`docs/Provider_States.md` vs `apps/web/lib/providers/providerState.ts`).
- Spec mismatch: lead lifecycle statuses/flags in docs vs implementation (`docs/Lead_Lifecycle.md` vs `apps/web/app/admin/leads/actions.ts`, `apps/web/app/request-quote/actions.ts`).
- TODO/FIXME references: not found (`rg "TODO|FIXME|HACK"` on `apps/web` and `docs`).

---

## How to update this document
Run these commands from the repo root to refresh route/action/table/bucket/env references:

```bash
find apps/web/app -name page.tsx
find apps/web/app -name actions.ts
rg -n "from\\(\\\"" apps/web
rg -n "rpc\\(" apps/web
rg -n "storage\\.from\\(" apps/web
rg -n "storage\\.from\\(\\\"claim-documents\\\"|claim-documents" apps/web
rg -n "process\\.env|NEXT_PUBLIC_" apps/web
```
