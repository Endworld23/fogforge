Never commit secrets.

Allowed env files to commit:
- `.env.example` only

If a secret is committed:
1) Rotate the exposed keys immediately.
2) Remove the secret from the repository history if required by policy.
