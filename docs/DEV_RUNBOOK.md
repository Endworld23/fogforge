# Dev Runbook (apps/web)

Run commands from `apps/web`, not repo root.

## Recommended sequence

```bash
npm run lint
npm run clean:next
npm run build
npm run start
```

## Common pitfalls

- `npm ERR! enoent ENOENT: no such file or directory, open 'package.json'`: run commands from `apps/web`.
- `.next` permission errors: if you previously ran builds with sudo, fix ownership once:

```bash
cd apps/web
sudo chown -R "$(whoami)":"$(id -gn)" .next 2>/dev/null || true
chmod -R u+rwX .next 2>/dev/null || true
rm -rf .next
```

## Env vars for Resend lead delivery

Set these in `.env.local` or your environment:

- `RESEND_API_KEY`
- `LEADS_FROM_EMAIL`
- `LEADS_BCC_EMAIL`
- `LEADS_FALLBACK_EMAIL`
