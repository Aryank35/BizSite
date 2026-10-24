# BizSite — multi-tenant business website builder

BizSite lets a platform owner onboard many businesses (furniture shops, boutiques, window manufacturers, service businesses…) and give each one a catalogue website with enquiries and WhatsApp built in. It is a catalogue and enquiry platform, not an online shop: there is no cart, payment or shipping.

| Area | Who | What |
| --- | --- | --- |
| Marketing site `/`, `/features`, `/pricing`, `/contact` | Public | Explains the product; the contact form stores "request a website" leads. |
| Platform admin `/admin/*` | Super admin | Businesses (create, search, suspend, delete), administrators and invitations, feature flags, publishing, templates and sections, platform-wide enquiries, audit trail. |
| Business dashboard `/dashboard/*` | Business admin | Profile, categories, products, website appearance and sections, draft preview and publishing, enquiry inbox, account. |
| Business websites `/site/<slug>/*` | Public | Homepage built from sections, product catalogue with categories and pagination, product pages with enquiry form and WhatsApp. |
| Draft preview `/preview/<businessId>/*` | Members of that business and super admins | Renders the current draft. |

## Tech stack

Next.js 16 (App Router, Cache Components) · React 19 · TypeScript 6 (strict) · Tailwind CSS 4 · shadcn/ui (Radix) · Lucide · PostgreSQL · Prisma 7 · Better Auth · Zod 4 · React Hook Form · Vitest · Playwright.

Deviations from the original brief, and why:

- **Better Auth instead of Auth.js.** Auth.js v5 is still in beta (`next-auth@5.0.0-beta`), and its maintainers now point to Better Auth. Better Auth gives database sessions, httpOnly cookies, scrypt password hashing and built-in rate limiting.
- **TypeScript 6.0**, not 7. `typescript-eslint` does not support TypeScript 7 yet.
- **Prisma 7.10** (stable). The npm `latest` tag currently points to an 8.0 release candidate.
- **Local PostgreSQL via `embedded-postgres`.** `npm run db:dev` runs real PostgreSQL binaries inside the project, so contributors need neither Docker nor a system install. Production uses any PostgreSQL through `DATABASE_URL`.

## Running locally from a clean checkout

You need Node.js 20.19+ (22 or 24 recommended).

```bash
npm install                     # also runs `prisma generate`
cp .env.example .env
# Put a random value in BETTER_AUTH_SECRET:
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

**Terminal 1** — start the development database. Leave it running; Ctrl+C stops it.

```bash
npm run db:dev                  # PostgreSQL on port 5544, data in ./.data/postgres
```

**Terminal 2** — set up the schema and demo data, then start the app:

```bash
npm run db:deploy               # apply migrations
npm run db:seed                 # RESETS all data, then loads demo content
npm run dev                     # http://localhost:3000
```

### Development accounts

The seed creates these accounts. Their passwords come from `.env` (`SEED_SUPERADMIN_PASSWORD` and `SEED_BUSINESS_ADMIN_PASSWORD`). They are development-only; the seed refuses to run when `NODE_ENV=production`.

| Account | Email | Business |
| --- | --- | --- |
| Super admin | `admin@bizsite.local` (or `SEED_SUPERADMIN_EMAIL`) | all |
| Business owner | `owner@royal-furniture.example` | Royal Furniture — published, Modern Catalogue |
| Business owner | `owner@odisha-windows.example` | Odisha Windows & Doors — published, Professional Business |
| Business owner | `owner@threadline.example` | Threadline Boutique — not published |
| Business owner | `owner@spark-electronics.example` | Spark Electronics — suspended |

Example public sites: `/site/royal-furniture`, `/site/odisha-windows`.

### Using your own PostgreSQL

Skip `npm run db:dev` and point `DATABASE_URL` (and `TEST_DATABASE_URL`, a separate database) at your server. Any PostgreSQL 14+ works.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generate route types and run `tsc --noEmit` |
| `npm run db:dev` | Local development PostgreSQL |
| `npm run db:migrate` | Create and apply a migration after editing `prisma/schema.prisma` |
| `npm run db:deploy` | Apply existing migrations (CI / production) |
| `npm run db:seed` | Reset and seed demo data (development only) |
| `npm run db:reset` | Drop, re-migrate and re-seed the development database |
| `npm test` | Unit tests |
| `npm run test:integration` | Service-level tests against `TEST_DATABASE_URL` (wiped by the tests) |
| `npm run test:e2e` | Playwright end-to-end tests |

## Project structure

```
prisma/                 schema.prisma, migrations/, seed.ts
scripts/dev-db.mts      embedded PostgreSQL for local development
src/
  app/
    (marketing)/        public marketing pages
    admin/              super admin dashboard + server actions
    dashboard/          business dashboard + server actions
    site/[slug]/        public business websites
    preview/[businessId]/ draft preview
    api/auth/           Better Auth handler
    api/uploads/        authenticated image upload
    media/[...key]/     serves locally stored uploads
    sitemap.ts, robots.ts
  components/
    ui/                 shadcn/ui primitives
    app/                dashboard shell and shared dashboard components
    site/               website renderer: frame, sections, pages, enquiry form
  lib/                  shared code: validators (Zod), website theme/sections/snapshot, money, env, auth
  server/               server-only code: session/tenant resolution, services, storage, throttling, audit
  proxy.ts              optimistic auth redirects + optional tenant subdomains
tests/
  unit/                 pure functions
  integration/          services against a real database (tenant isolation, publishing, invitations)
  e2e/                  Playwright workflows
```

## How it works

### Tenancy and security

- **Tenant context comes from the server.** `requireTenant()` (in `src/server/session.ts`) reads the Better Auth session, re-loads the user from the database, and resolves the business through the user's `BusinessMembership`. A super admin opens a business with "Manage content"; that business id goes into an httpOnly cookie and is re-validated on every request. A business id sent by the client is never trusted.
- **Every service is tenant-scoped.** Services in `src/server/services` take a `TenantContext`, and every query filters by `ctx.businessId`. Another tenant's record is reported as "not found", so its existence is not revealed. Images can only reference uploads from the same business's media library.
- **Permissions.** `can(ctx, permission)` in `src/server/tenant.ts`:
  - Owners manage everything.
  - Editors manage content and enquiries, but not the profile or publishing.
  - Publishing also requires the business's `allowSelfPublish` flag.
  - Members of a suspended business can change nothing.
- **Authentication.**
  - Accounts are created by invitation only: single-use tokens, stored as SHA-256 hashes, expire after 7 days.
  - Passwords are hashed with scrypt.
  - Sign-in is rate limited to 5 attempts per minute per IP, stored in the database.
  - Sign-in errors are generic.
  - Suspended users cannot start sessions, and suspending a user deletes their existing sessions.
- **Validation.** Zod validates every server action and service input. The same schemas drive the client forms.
- **Abuse control on public forms.** Public forms use a honeypot field, plus fixed-window limits in PostgreSQL: 5 enquiries per 10 minutes per hashed IP, and 200 per hour per business.
- **Uploads.** Images are checked by magic bytes; only JPEG, PNG, WebP and GIF are accepted, with no SVG. The limit is 5 MB, and uploads are throttled per user. Storage keys are random, and local files are served with `nosniff` and a strict CSP.
- **Safe rendering.**
  - User text is rendered as text, never as HTML.
  - Colours must be `#rrggbb` before they reach a style attribute.
  - Social links must be https.
  - WhatsApp numbers are stored as digits only.
- **Audit log.** Business creation, settings, status changes, deletion, admin assignment, invitations, publishing and platform settings are written to `audit_logs`. The admin overview shows them.
- **Headers.** Security headers are set in `next.config.ts`. Private areas send `X-Robots-Tag: noindex`, and `robots.txt` disallows them.

### Draft and publish

- `WebsiteConfig` columns hold the **draft** theme: template, colours, font, logo, navigation, footer and SEO settings.
- Each business has one `WebsiteSection` row per section type (14 types). Each row has Zod-validated JSON content, a visibility flag and a sort order.
- **Publishing** builds a snapshot from the draft and validates every section. It then writes, in one transaction:
  - the snapshot to `WebsiteConfig.publishedConfig`,
  - `Business.publishedAt`,
  - a `WebsitePublication` history row.
- The public site renders **only** that snapshot, so editing the draft never changes the live website.
- Profile details and products are live data. Products are published individually, and anonymous visitors never see a draft product.
- A website is public only while the business is `ACTIVE`, `publishedAt` is set and the snapshot is valid. Hidden ("contact for price") prices are never sent to the browser.

### Templates and sections

Both templates ("Modern Catalogue" and "Professional Business") render the same section components, styled through template tokens in `src/components/site/template-styles.ts`. Sections and their schemas live in `src/lib/website/sections.ts`. To add a section type:

1. Add it to the Prisma enum and to `SECTION_TYPES`.
2. Add its Zod schema and definition.
3. Add a component and a case in `site-pages.tsx`.
4. Add editor fields in `section-edit-dialog.tsx`.

Super admins can disable templates and section types platform-wide under **Admin → Templates**.

### Routing and subdomains

Business websites are served at `/site/<slug>`.

Setting `TENANT_ROOT_DOMAIN` (for example `bizsite.com`) makes `proxy.ts` rewrite `<slug>.bizsite.com/...` to `/site/<slug>/...`. Links on the site then drop the `/site/<slug>` prefix, and canonical URLs use the subdomain. This needs wildcard DNS and TLS. Custom domains are not implemented.

### Rendering notes

Cache Components (Partial Prerendering) is on.

- **Dashboards.** They stream behind per-route `loading.tsx` skeletons. If a session is missing or a user lacks a role, the page streams a redirect; `proxy.ts` already redirects requests that have no session cookie.
- **Public sites.** They render in one pass, with no skeleton. Missing, unpublished or suspended pages show the not-found page with `noindex`:
  - In `next dev` that response is a 404.
  - In production the prerendered shell has already been sent, so the status is 200 (a "soft 404"). No unpublished data is ever included.
  - Returning a hard 404 would need a database lookup in `proxy.ts`.
- **Statistics.** All figures are database counts. Visitor traffic is not tracked, so none is shown.

## Testing

```bash
npm test                        # 32 unit tests
npm run test:integration        # 38 service tests, needs the database (npm run db:dev)
npm run test:e2e                # 14 browser tests
```

- **Integration tests** run against `TEST_DATABASE_URL`, which they migrate and wipe.
  - `tests/integration/tenant-isolation.test.ts` proves that one business administrator cannot read, update or delete another business's products, categories, enquiries, profile or images, even with the record ids.
  - The other suites cover publishing, the public catalogue, enquiries, invitations and administration.
- **End-to-end tests** use the seeded development database and start `npm run dev` if nothing is listening on port 3000.
  - To test a production build, run `npm run build`, then start it with `APP_URL` and `BETTER_AUTH_URL` set to its address, and set `E2E_BASE_URL` to that address for Playwright.
  - Run `npx playwright install chromium` once.
  - The sign-in rate limit (5 per minute) can trip if you run the suite repeatedly within a minute; wait a minute and re-run.

## Deployment

Any Node.js host works. The tested target is Vercel (or a Node server or container), paired with a managed PostgreSQL provider such as Neon, Supabase, RDS or Cloud SQL.

1. Create a PostgreSQL database and set `DATABASE_URL`. Use a pooled connection string if the provider offers one.
2. Set the environment variables:
   - `APP_URL` and `BETTER_AUTH_URL` — the public https URL
   - `BETTER_AUTH_SECRET` — a new random value
   - `STORAGE_DRIVER=s3` with `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT` (for R2 or MinIO), `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` and `S3_PUBLIC_URL`.

   The local storage driver writes to disk, so it is only suitable for a single server with persistent storage, never for serverless.
3. Build with `npm run build`, and run `npm run db:deploy` (which runs `prisma migrate deploy`) as part of the release.
4. Create the first super admin. There is deliberately no sign-up and no production seed. Insert one user with role `SUPER_ADMIN` and a credential account, for example with a one-off script using `hashPassword` from `better-auth/crypto`, as `prisma/seed.ts` does. Then invite everyone else from the admin UI.
5. Optional: set up wildcard DNS and `TENANT_ROOT_DOMAIN` for subdomains.

There is no email service. Invitation links are shown to the super admin to share directly. To send them automatically, add an email provider at `inviteBusinessAdmin` in `src/server/services/businesses.ts`.

## Not yet implemented

- Email delivery (invitations, enquiry notifications) and a forgotten-password flow. Signed-in users can change their password under Settings.
- Switching between several businesses for one business admin. The data model supports it; the first membership is used.
- A media library page for browsing and deleting uploads. Uploads happen inline in forms.
- Custom domains, billing and visitor analytics, all intentionally out of scope.
- Caching of public pages with `use cache` and tag invalidation on publish. Public pages currently query the database on each request.
