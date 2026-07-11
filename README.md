# Incontri di Bakeka

Marketplace React/Vite con Supabase, Stripe e un server Express opzionale per lo sviluppo locale.

## Sviluppo locale

Requisiti: Node.js 20 o superiore e pnpm 11.7.0.

```bash
cp .env.example .env
pnpm install --frozen-lockfile
pnpm dev
```

Prima di pubblicare modifiche:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm audit --prod
```

## Deploy

Il frontend viene pubblicato su GitHub Pages quando viene aggiornato `master`.

Il backend Supabase si pubblica manualmente dal workflow **Deploy Supabase Backend**. Il workflow esegue prima un dry-run, applica le migrazioni e solo dopo distribuisce le Edge Functions. Configurare questi GitHub Actions secrets:

- `SUPABASE_ADMIN_TOKEN`
- `SUPABASE_DB_PASSWORD`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `VITE_STRIPE_PRICE_10`
- `VITE_STRIPE_PRICE_30`
- `VITE_STRIPE_PRICE_70`
- `VITE_STRIPE_PRICE_150`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

La migrazione `20260711000000_security_hardening.sql` deve essere applicata insieme alle Edge Functions: contiene le RPC atomiche usate da pagamenti e boost.
