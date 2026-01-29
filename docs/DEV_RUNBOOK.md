# Dev Runbook (apps/web)

Run commands from `apps/web`, not repo root.

## Recommended sequence

```bash
npm run lint
npm run clean:next
npm run build
npm run start
```

## Smoke test checklist

- Submit a request-quote (global or metro).
- Verify the lead appears in `/admin/leads` and `/admin/leads/board`.
- Sign in as a provider and check `/dashboard/leads` and `/dashboard/leads/board`.
- If email delivery is enabled, resend a lead and confirm delivery_status updates.

## Common pitfalls

- `npm ERR! enoent ENOENT: no such file or directory, open 'package.json'`: run commands from `apps/web`.
- `.next` permission errors: if you previously ran builds with sudo, fix ownership once:

```bash
cd apps/web
sudo chown -R "$(whoami)":"$(id -gn)" .next 2>/dev/null || true
chmod -R u+rwX .next 2>/dev/null || true
rm -rf .next
```

## Env vars for lead delivery + confirmations

Set these in `.env.local` or your environment:

- `RESEND_API_KEY`
- `LEADS_FROM_EMAIL`
- `LEADS_BCC_EMAIL`
- `LEADS_FALLBACK_EMAIL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Architecture

Use `docs/ARCHITECTURE_INDEX.md` to cross-reference routes, actions, tables, and integrations when updating features or debugging production behavior.

## Optional helper

```bash
npm run smoke
```
