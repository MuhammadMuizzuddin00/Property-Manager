# Ruang Kita — Property Management SaaS (Starter)

A **fully runnable** Next.js + TypeScript + Prisma + Clerk + Stripe starter.
Two portals: a staff dashboard (landlords/managers) and a tenant portal,
both with real auth, calling real API routes backed by a real schema.

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Set up your environment
cp .env.example .env.local
# fill in DATABASE_URL, Clerk keys, Stripe key — see "Services you need" below

# 3. Push the schema to your database
npx prisma migrate dev --name init

# 4. Run it
npm run dev
```

Open **http://localhost:3000** — you'll see a landing page with links to
`/dashboard` (staff) and `/portal` (tenants), both of which redirect to
Clerk sign-in if you're not logged in.

## Services you need (all have free tiers)

| Service | What it's for | Get keys from |
|---|---|---|
| **Supabase** or **Neon** | Postgres database | supabase.com / neon.tech |
| **Clerk** | Auth (staff + tenant login) | clerk.com |
| **Stripe** | Billing by property count | dashboard.stripe.com/apikeys |

Paste all keys into `.env.local` (copy `.env.example` as your starting
point).

## What's wired up and working

- **Landing page** → links to both portals
- **Clerk auth** on both `/dashboard/*` and `/portal/*` (see `middleware.ts`)
- **Auto-provisioning**: the first time a new staff user reaches
  `/dashboard`, `lib/auth.ts` automatically creates their `Organization` +
  `User` record — no manual database setup needed for new signups
- **Staff dashboard**: overview stats, Properties (with per-property Units),
  Tenants, Rent tracking (add + mark paid), Maintenance (filter + advance
  status) — all with real forms calling real API routes
- **Tenant portal**: file + view maintenance requests for their own unit
- **Tenant invites**: adding a tenant with an email automatically sends them
  a Clerk-hosted invite email; the first time they log into `/portal`,
  `getCurrentTenant()` auto-links their Clerk account to the right `Tenant`
  row by matching email — no manual database step needed
- **Billing sync**: adding a property automatically recalculates the org's
  subscription tier (`lib/stripe.ts`)
- **Stripe Checkout**: `/dashboard/billing` lets staff pick a paid plan and
  pay via Stripe's hosted checkout; a webhook
  (`app/api/webhooks/stripe/route.ts`) keeps `Organization.subscriptionTier`
  in sync with whatever Stripe reports (upgrades, downgrades, cancellations)
- **Full edit/delete on Properties, Units, and Tenants** — not just create.
  Every form shows inline error messages (validation failures, ownership
  checks, conflicts) instead of failing silently, and every delete asks for
  confirmation first.
  - Deleting a **Property** is blocked while it still has Units.
  - A **Unit** with zero history (never had a tenant or maintenance
    request) can be hard-deleted. A Unit *with* history can't be — deleting
    it would destroy real financial/maintenance records — so it gets an
    **Archive** button instead: `Unit.archived` hides it from the active
    list while keeping all its history intact, and it can be unarchived any
    time via the "Show archived units" toggle on the property page.
  - "Deleting" a **Tenant** actually ends their tenancy (`active: false`)
    rather than hard-deleting, for the same reason — it preserves their
    rent payment and maintenance history.
  - ⚠️ **Requires a migration**: `Unit.archived` is a new schema field. Run
    `npx prisma migrate dev --name add_unit_archived` after pulling this
    change, or your dev database will be out of sync with `schema.prisma`.
- **Ownership checks everywhere**: every API route verifies the requested
  property/unit/tenant/payment/request actually belongs to the caller's own
  org before reading or writing it
- **Full CRUD, not just create**: Properties, Units, and Tenants all support
  edit and delete from the dashboard. Deleting a Tenant is a soft delete
  (sets `active: false`, ends the lease) rather than a hard delete, so rent
  and maintenance history is preserved and the unit becomes vacant again.
  Deleting a Property or Unit is blocked (with a clear error message) while
  it still has Units or an active Tenant respectively — remove those first.
- **Form error handling**: every add/edit form shows a real error message
  inline (not a silent failure) when the server rejects a submission, and
  disables the submit button while a request is in flight. Deletes ask for
  confirmation before doing anything irreversible.

## Billing: plan-limit model (resolved)

The two-competing-sources-of-tier issue from earlier is fixed. The model
now is: **staff picks a plan and pays for it** via Stripe Checkout.
`Organization.subscriptionTier` only ever changes via the Stripe webhook
(`app/api/webhooks/stripe/route.ts`) — nothing else touches it.

`assertCanAddProperty()` (in `lib/stripe.ts`) enforces the current plan's
property limit: adding a property beyond your plan's `maxProperties`
returns a 402 with a message pointing at the Billing page. No more silent
tier overwrites when you add/archive/delete a property.

Staff can also manage their subscription (update card, cancel) themselves
via **Manage billing** on the Billing page, which opens the Stripe Customer
Portal — you'll need to turn that on once in the Stripe Dashboard under
Settings → Billing → Customer portal (test mode has it enabled by default).

## Team: invite a teammate to your Organization

`/dashboard/team` lists everyone in your Organization and lets you invite
another landlord/manager by email. Same pattern as tenant invites: Clerk
sends the invite email, and — instead of matching by email like tenants —
we stash `invitedOrganizationId` in the invitee's Clerk `publicMetadata`
when the invite is created. The first time they reach `/dashboard`,
`getCurrentStaffUser()` checks for that metadata and joins them to your
existing Organization (as `MANAGER`) instead of creating them a brand new
one.

## Overdue rent & lease-expiry reminders — now with real emails

- **Status stays accurate everywhere**: any `RentPayment` still `PENDING`
  past its `dueDate` flips to `LATE` inline whenever `/api/rent` or the
  dashboard Overview loads — no cron needed just to keep statuses correct.
- **Actual emails**: `GET /api/cron/check-overdue` (protected by
  `CRON_SECRET`) sends a real email via [Resend](https://resend.com) to the
  tenant when their rent goes overdue, and to tenants whose lease ends
  within 30 days — each only ever sent **once** per event, tracked via
  `RentPayment.lateReminderSentAt` / `Tenant.leaseReminderSentAt`.
  `vercel.json` schedules this daily at 1am if you deploy to Vercel; on
  another host, point any external scheduler (cron-job.org, GitHub Actions,
  etc.) at that URL with an `Authorization: Bearer <CRON_SECRET>` header.
- **Without `RESEND_API_KEY` set**, the app still works fine — reminder
  emails just get logged to the console instead of sent, so you're never
  blocked from developing locally without a Resend account.
- **Resend setup**: free tier account at resend.com, grab an API key. Their
  sandbox sender `onboarding@resend.dev` only delivers to the email you
  signed up to Resend with — verify your own domain there before relying on
  this for real tenants.
- **Dashboard banners** (unchanged): red banner for overdue rent, amber
  banner for leases ending soon, both on the Overview page.

## Search & filter

Properties, Tenants, and Rent pages all have a search box (client-side,
filtering whatever's already loaded — fine at the scale a single landlord
manages, but swap to a server-side search param if a list ever grows into
the thousands). Rent also has a status filter dropdown; Maintenance already
had one.

## Mobile responsiveness

The dashboard sidebar is now an off-canvas drawer on small screens
(`app/dashboard/dashboard-shell.tsx` + `sidebar-nav.tsx`) — tap the hamburger
icon to open it, tap a link or the backdrop to close. All the multi-column
forms across the app now stack to a single column below the `sm:` Tailwind
breakpoint. The tenant portal was already narrow enough to work fine on
mobile as-is.

## Legal pages

`/terms` and `/privacy` are generic starting templates — including a note
about Malaysia's PDPA for the privacy policy — linked from the landing
page footer. **Have an actual lawyer review both before accepting real
payments from real customers.** Replace every `[bracketed placeholder]`
(company name, support email, bank details) with your real details.

## Payment methods for the Malaysian market

Stripe Checkout here is **card-only**, because Stripe doesn't support FPX
(Malaysian online banking) for *recurring* subscriptions — FPX is a
one-time bank authorization, not something Stripe can silently re-charge
next month the way it can a saved card. This is a real Stripe limitation,
not something fixable with more code.

The practical workaround many Malaysian SaaS products use — implemented
here — is a **manual bank transfer request** as an alternative to the card
checkout:

1. On the Billing page, each paid plan has an "Or pay via bank transfer"
   link. Clicking it and confirming creates a request with a unique
   reference code (`Organization.pendingPlanRequest` /
   `pendingPlanReference`) and emails you (via `ADMIN_EMAIL`) the details.
2. You manually check your bank account for a transfer matching that
   reference.
3. You approve (or reject) it at **`/admin/requests`** — only accessible to
   whichever Clerk account's email matches `ADMIN_EMAIL` in your env
   (see `lib/auth.ts` → `isPlatformAdmin()`). Approving sets
   `subscriptionTier` directly, same as the Stripe webhook would.

This is intentionally manual/lightweight rather than a full payment
gateway integration — fine for a small number of monthly requests, but if
you outgrow checking a spreadsheet-like admin page by hand, look at
**Billplz**, **CHIP**, or **senangPay** — Malaysian payment gateways that
support FPX more natively than Stripe does. Remember to replace the
placeholder bank details in `app/dashboard/billing/bank-transfer-option.tsx`
with your real ones.

⚠️ **Requires a migration**: `Organization` gained three new fields
(`pendingPlanRequest`, `pendingPlanReference`, `pendingPlanRequestedAt`).
Run `npx prisma db push` after pulling this change (see the note on `db
push` vs `migrate dev` further down — this project's migration history has
drifted from the actual database, so `db push` is the safer command here).

## Photo uploads for maintenance requests

Tenants (and staff, if you build a create-form for them later) can attach
photos when filing a maintenance request. Uploads go through
`POST /api/upload` to **Vercel Blob** and the returned public URL is stored
in `MaintenanceRequest.photoUrls`.

⚠️ **Requires setup**: add the "Blob" storage integration to your Vercel
project (Storage tab → Create → Blob) — this auto-generates a
`BLOB_READ_WRITE_TOKEN` env var, no manual key copying needed. Without it,
uploads will fail with a 500 error.

## Error monitoring (Sentry)

`sentry.client.config.ts` / `sentry.server.config.ts` / `sentry.edge.config.ts`
report runtime errors to Sentry so you find out about production bugs
before a customer complains. Sign up free at sentry.io, create a project,
grab the DSN, and set `NEXT_PUBLIC_SENTRY_DSN` in your env. `SENTRY_ORG` /
`SENTRY_PROJECT` are optional — they only improve stack traces via source
map upload during build. Without any of these set, the app runs completely
normally — errors just go unreported.

## Favicon & SEO

`app/icon.svg` is auto-detected by Next.js as the site favicon. Metadata in
`app/layout.tsx` includes Open Graph and Twitter card tags for nicer link
previews, plus `app/robots.ts` and `app/sitemap.ts` for search engines —
the dashboard/portal/admin routes are deliberately excluded from indexing
since they're behind auth anyway.

## Testing Stripe webhooks locally

Stripe needs a public URL to send webhook events to, which `localhost`
isn't. Use the [Stripe CLI](https://stripe.com/docs/stripe-cli) to forward
events to your local server instead:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

This prints a webhook signing secret (`whsec_...`) — paste that into
`STRIPE_WEBHOOK_SECRET` in your `.env.local`. Keep `stripe listen` running
in a separate terminal alongside `npm run dev` while you test checkout.

## ⚠️ Use `prisma db push`, not `migrate dev`

This project's Prisma migration history drifted from the actual database
early on (a manual fix was applied directly with `db push` instead of
going through a migration file). Because of that, running
`npx prisma migrate dev` will now offer to **reset your entire database**
to reconcile the mismatch — say no if you ever see that prompt, since it
deletes all your data.

For any future schema change: edit `schema.prisma`, then run
`npx prisma db push` (not `migrate dev`) to sync it to the database
directly, no migration file, no reset risk. This project isn't using
migration files as its source of truth anymore — `schema.prisma` +
`db push` is.

## File map

```
propman-starter/
├── prisma/schema.prisma          # Full data model
├── middleware.ts                 # Protects /dashboard and /portal
├── lib/
│   ├── prisma.ts                 # DB client
│   ├── auth.ts                   # Resolves logged-in staff user → Organization
│   └── stripe.ts                 # Property count → subscription tier
├── app/
│   ├── layout.tsx / page.tsx     # Root layout + landing page
│   ├── sign-in/, sign-up/        # Clerk auth pages
│   ├── dashboard/                # Staff-facing pages
│   │   ├── layout.tsx            # Sidebar nav + auth check
│   │   ├── page.tsx              # Overview stats
│   │   └── properties/page.tsx   # List + add properties
│   ├── portal/                   # Tenant-facing pages
│   │   ├── layout.tsx            # Auth check
│   │   └── page.tsx              # File + view maintenance requests
│   └── api/
│       ├── properties/route.ts           # Staff: CRUD properties
│       ├── maintenance/route.ts          # Staff: view/log maintenance
│       └── portal/maintenance/route.ts   # Tenant: file/view own requests
```

## Two auth realms: staff vs. tenants

Staff and tenants are both Clerk users, but scoped completely differently:

- **Staff** → linked to a `User` row → belongs to an `Organization`. Can see
  everything under their org.
- **Tenants** → linked directly to a `Tenant` row via `clerkUserId`. Can
  only ever see their own `unitId` — the tenant API routes look this up
  server-side from the session, never from client input (see
  `app/api/portal/maintenance/route.ts`).

## Rent payments: manual for now

No payment processor integration yet — landlords mark `RentPayment.status`
as PAID manually. A daily cron (Vercel Cron is free and easy) can flip
overdue PENDING rows to LATE:

```ts
await prisma.rentPayment.updateMany({
  where: { status: "PENDING", dueDate: { lt: new Date() } },
  data: { status: "LATE" },
});
```

Add Stripe/ACH online collection later without a schema change — just add
a `stripePaymentIntentId` column when you're ready.

## Suggested next steps, in order

1. Wire up the Organization-creation-on-signup flow (see stub #1 above)
2. Build Units + Tenants CRUD (same pattern as Properties)
3. Build the Rent tracking page + the daily cron
4. Build the staff-side Maintenance view (the API route already exists)
5. Add Stripe Checkout so an org can actually pick and pay for a plan
6. Polish the UI once the data layer is solid
