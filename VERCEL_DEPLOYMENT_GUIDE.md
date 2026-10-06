# AceWears — Vercel Deployment Guide

This guide walks you through deploying the AceWears Next.js app to Vercel from GitHub. If your Vercel build is failing, **start with Step 1** — most build failures are caused by the missing `postinstall: prisma generate` hook.

---

## ⚠️ Common Build Failures (and the fixes already applied)

These fixes have already been applied to this repo. They are documented here so you understand what changed and why.

### 1. ✅ FIXED: Prisma Client not generated at build time
**Symptom**: Build error like `Cannot find module '.prisma/client'` or `@prisma/client did not initialize yet`.
**Fix applied**: Added `"postinstall": "prisma generate"` to `package.json`. Vercel now runs Prisma generate automatically after `npm install`.

### 2. ✅ FIXED: Build script with self-hosting `cp` commands
**Symptom**: Build error like `cp: cannot stat '.next/standalone/.next/'`.
**Fix applied**: Simplified `"build"` to just `"next build"`. The standalone-mode `cp` commands moved to `"build:standalone"` for self-hosting only.

### 3. ✅ FIXED: `output: "standalone"` in next.config.ts
**Symptom**: Slow builds / unnecessary standalone output being uploaded to Vercel.
**Fix applied**: Commented out `output: "standalone"`. Vercel handles Next.js natively; standalone is for self-hosting with a Node server. Uncomment it only if you're self-hosting.

### 4. ✅ FIXED: No `engines.node` field
**Symptom**: Vercel uses an older Node version that doesn't support Next.js 16.
**Fix applied**: Added `"engines": { "node": ">=20.0.0" }` to `package.json`.

### 5. ✅ FIXED: Missing `vercel.json`
**Fix applied**: Created `vercel.json` with framework: nextjs, 60s function timeout for API routes, security headers, and service worker cache rules.

### 6. ✅ FIXED: Prisma `serverExternalPackages`
**Symptom**: Build error about Prisma not bundling correctly into serverless functions.
**Fix applied**: Added `serverExternalPackages: ["@prisma/client", "@node-rs/argon2"]` in `next.config.ts`.

---

## 🚀 Deployment Steps

### Step 1 — Push the updated code to GitHub

```bash
git add .
git commit -m "fix: Vercel deployment — postinstall, build script, vercel.json"
git push origin main
```

Vercel will auto-deploy from your main branch.

### Step 2 — Set up a PostgreSQL database (REQUIRED)

**SQLite will NOT work on Vercel** because serverless functions have a read-only filesystem (except `/tmp`, which is ephemeral and lost between invocations).

Choose ONE of these free PostgreSQL providers:

#### Option A: Neon (recommended — fastest, free tier)
1. Go to https://neon.tech and sign up
2. Create a new project → name it `acewears`
3. Copy the connection string — looks like:
   ```
   postgresql://user:password@ep-xxx-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require
   ```
4. Save it — you'll paste it into Vercel in Step 3.

#### Option B: Supabase
1. Go to https://supabase.com and sign up
2. Create a new project
3. Go to Project Settings → Database → Connection string → URI
4. Copy the connection string

#### Option C: Vercel Postgres (built into Vercel)
1. In your Vercel project dashboard → Storage → Create Database → Postgres (Neon)
2. Vercel will auto-inject `POSTGRES_URL` env var — but our app reads `DATABASE_URL`, so you'll need to also create a `DATABASE_URL` env var pointing to the same database.

### Step 3 — Configure environment variables on Vercel

In your Vercel project → **Settings → Environment Variables**, add the following (use Production + Preview + Development environments where appropriate):

| Variable | Value | Environments |
|----------|-------|--------------|
| `DATABASE_URL` | `postgresql://...` (from Step 2) | Production, Preview, Development |
| `NEXT_PUBLIC_URL` | `https://your-project.vercel.app` | Production, Preview |
| `PAYSTACK_PUBLIC_KEY` | `pk_test_...` or `pk_live_...` | All |
| `PAYSTACK_SECRET_KEY` | `sk_test_...` or `sk_live_...` | All |
| `PAYSTACK_CALLBACK_URL` | `https://your-project.vercel.app/api/checkout/verify` | Production |
| `SENDGRID_API_KEY` | `SG....` | All |
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` to generate | All |
| `NEXTAUTH_URL` | `https://your-project.vercel.app` | Production |

> ⚠️ **Critical**: After adding env vars, you MUST redeploy. Vercel does not auto-rebuild on env var changes.

### Step 4 — Switch Prisma schema to PostgreSQL

**The current `prisma/schema.prisma` uses SQLite.** For Vercel production, you need PostgreSQL.

```bash
# Back up the SQLite schema
cp prisma/schema.prisma prisma/schema.sqlite.prisma.bak

# Copy the production schema over
cp prisma/schema.production.prisma prisma/schema.prisma

# IMPORTANT: Open prisma/schema.prisma and copy ALL the model definitions
# from your SQLite schema into the new PostgreSQL schema. The production
# template only has the User model as a placeholder.

# Generate the Prisma client with the new schema
npx prisma generate

# Push the schema to your new Postgres database
# (set DATABASE_URL in your .env first, or use: DATABASE_URL=postgresql://... npx prisma db push)
npx prisma db push
```

Commit and push:
```bash
git add prisma/schema.prisma
git commit -m "chore: switch Prisma to PostgreSQL for Vercel"
git push origin main
```

### Step 5 — Trigger a fresh Vercel deploy

After the push, Vercel should auto-trigger a new deployment. If not:
- Vercel dashboard → Deployments → Redeploy (check "Use existing Build Cache" is OFF)

### Step 6 — Verify the deploy

Once deployed:
- Visit the production URL — homepage should load
- Test `/api/health` (if it exists) or any API route
- Try logging in — if it works, the database is connected
- Check Vercel → Functions logs for any runtime errors

---

## 🐛 Troubleshooting

### "Cannot find module '@prisma/client'" or similar Prisma errors
✅ Already fixed by `postinstall: prisma generate`. If still failing:
- Check that `prisma/schema.prisma` has a valid `generator client` block
- Delete `node_modules` and `package-lock.json`, then `npm install` and `npx prisma generate`

### Build times out (>45 min)
Vercel Hobby tier has a 45-minute build timeout. With 89 dependencies, this can be tight:
- Make sure you're not installing devDependencies in production. Vercel should do this automatically.
- If still slow, consider switching to `pnpm` for faster installs (update `installCommand` in `vercel.json`).

### Serverless function size limit exceeded (50MB)
- The `serverExternalPackages` config in `next.config.ts` should handle Prisma
- If still failing, you may need to enable `experimental.optimizePackageImports` or use dynamic imports for heavy libs

### "Database connection failed" at runtime
- Verify `DATABASE_URL` is set in Vercel env vars for the correct environment
- For Neon, make sure `?sslmode=require` is in the connection string
- For Supabase, make sure you're using the connection pooler URL (port 6543), not the direct connection (port 5432)
- Run `npx prisma db push` to confirm the schema is created in the database

### Static page generation fails
If a page imports Prisma at the top level and tries to query the DB at build time, it will fail because `DATABASE_URL` may not be available at build time on Vercel.
- Mark those pages as `dynamic = true` or use `export const revalidate = 0` to opt out of static generation
- Or move DB queries behind `fetch()` calls so they only run at request time

### "Module not found: Can't resolve 'bufferutil'/'utf-8-validate'"
These are optional peer deps of `ws` (WebSocket). Vercel doesn't need them.
- Add to `next.config.ts`: `webpack: (config) => { config.resolve.fallback = { ...config.resolve.fallback, bufferutil: false, 'utf-8-validate': false }; return config; }`

### Mismatch between local and Vercel Node version
- Vercel uses Node 20.x by default. Your `engines.node: ">=20.0.0"` will be respected.
- If you need a specific version, set `NODE_VERSION` env var in Vercel.

---

## 🔁 Self-hosting Alternative (Docker / VPS)

If you'd rather self-host instead of using Vercel:

```bash
# Build for standalone server mode
npm run build:standalone

# Run the standalone server (uses bun runtime — install with `curl -fsSL https://bun.sh/install | bash`)
npm run start

# Or use Node directly:
node .next/standalone/server.js
```

For Docker:
1. Uncomment `output: "standalone"` in `next.config.ts`
2. Build with `npm run build:standalone`
3. Copy `.next/standalone`, `.next/static`, `public` into your Docker image
4. Run with `node server.js`

---

## 📞 Getting Help

If the build still fails after applying all the fixes in this guide:
1. Copy the **full build log** from Vercel → Deployments → [failed deploy] → Build Logs
2. Look for the FIRST error message (ignore subsequent "exited with code 1" lines)
3. Common error patterns and fixes are documented above in "Troubleshooting"

The most common remaining issue after these fixes is **database connectivity** — make sure your Postgres database is reachable from Vercel's servers (not localhost-firewalled).
