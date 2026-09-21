# TenantAI

TenantAI is a tenant-focused housing assistance workspace. It helps renters describe housing concerns, organize facts, review AI-generated possibilities and next steps, and prepare professional communications for a landlord or property manager.

## Current state

- React + Vite application shell with Dashboard, Analyze, My Cases, Documents, Messages, Resources, and Profile areas.
- Existing Express endpoints preserved: `/health`, `/api/states`, and `/api/analyze`.
- OpenAI-backed structured analysis remains server-side, with the existing fallback when `OPENAI_API_KEY` is unavailable.
- Cases, documents, messages, and profiles are intentionally unconnected. The UI does not simulate browser-local persistence or fake uploads, accounts, payments, or sending.

## Integrations and configuration

The repository currently has no wired authentication, database, private document storage, or Stripe integration. `@clerk/express` is present as an unused dependency, but Clerk requires both server and browser configuration before accounts and protected routes can be enabled. See `.env.example` for the required variables.

## Run locally

Requirements: Node.js 20+ and pnpm.

```bash
pnpm install
pnpm dev
```

For a production build served by Express:

```bash
pnpm build
npm start
```

TenantAI provides general informational assistance, not legal advice or guaranteed legal conclusions.
