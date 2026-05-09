# J&A Opulence Events App

Next.js subdomain app for `events.jaopulenceevents.co.uk`.

## Stack

- Next.js App Router
- Supabase Postgres/Auth/Storage
- Stripe Checkout + webhook fulfillment
- Resend transactional email
- PDF ticket generation with QR payload signing

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Add Supabase, Stripe, Resend, and signing secrets.
3. Run `npm install`.
4. Run `npm run dev`.

## Required Supabase setup

1. Create a `tickets` storage bucket.
2. Run the SQL migration under `supabase/migrations`.
3. Create the first admin in Supabase Auth.
4. Insert that user's UUID into `admin_profiles` with role `owner`.

## Stripe setup

- Checkout success URL: `https://events.jaopulenceevents.co.uk/checkout/success`
- Webhook endpoint: `https://events.jaopulenceevents.co.uk/api/stripe/webhook`
- Subscribe to:
  - `checkout.session.completed`
  - `checkout.session.async_payment_succeeded`
  - `checkout.session.async_payment_failed`

## Deployment

- Deploy this folder to Vercel as a separate project.
- Attach `events.jaopulenceevents.co.uk`.
- Keep the root HTML site on cPanel unchanged.
