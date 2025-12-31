# Fogforge Vercel Deployment

This guide covers deploying the `apps/web` Next.js App Router app to Vercel with Supabase hosted on supabase.com.

## Vercel Project Setup

1) Create a new Vercel project and select this repo.
2) Set the Root Directory to `apps/web`.
3) Framework preset: Next.js.
4) Build Command: `npm run build`
5) Output Directory: `.next`
6) Install Command: `npm install`

## Required Environment Variables

Add these in Vercel (Project Settings → Environment Variables). Copy/paste:

```
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Lead delivery (optional)
RESEND_API_KEY=your_resend_api_key
LEADS_FROM_EMAIL=Fogforge Leads <leads@yourdomain.com>
LEADS_BCC_EMAIL=you@yourdomain.com
```

Notes:
- `NEXT_PUBLIC_SITE_URL` must match your primary production URL.
- Do not add service role keys to Vercel.
- Keep secrets only in Vercel env vars, never committed.

## Supabase Auth Settings

In Supabase Dashboard → Authentication → URL Configuration:

- Site URL: `https://your-domain.com`
- Redirect URLs (add all you use):
  - `https://your-domain.com/*`
  - `https://your-domain.com/login`
  - `https://your-domain.com/admin/*`

If you use a preview environment, add the Vercel preview domain(s) as well.

## Auth + Session Runtime Guidance

- Server Components must use read-only Supabase SSR client.
- Server Actions, Route Handlers, and Middleware can use the writeable SSR client.
- Middleware is kept minimal and uses cookie refresh only.
- No routes are set to `runtime='edge'`.

## Verify Deployment

1) Visit `/login`, create/sign in.
2) Navigate to `/admin` and confirm redirect works.
3) Import providers (Admin → Import Providers).
4) Submit a lead on a provider page and confirm:
   - Lead shows in `/admin/leads`
   - Delivery status is logged

## Rotate Keys Safely

1) Generate new keys in Supabase or Resend.
2) Update Vercel env vars.
3) Redeploy.
4) Remove old keys only after confirming the new keys work.
