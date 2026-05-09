# J&A Opulence Events Launch Checklist

## Services

1. Create the `Supabase` project and capture:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
2. Create the `Resend` account and verify the sender domain for `tickets@jaopulenceevents.co.uk`.
3. Create the `Vercel` project and point it at the `event-app` folder.
4. Keep the root cPanel site unchanged while the subdomain app is verified.

## Environment

Set the values from [`.env.example`](c:/Users/Admin/Desktop/j&a/event-app/.env.example) locally and in Vercel:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `RESEND_AUDIENCE_EMAIL`
- `TICKET_SIGNING_SECRET`

## Supabase

1. Run [0001_v1_schema.sql](c:/Users/Admin/Desktop/j&a/event-app/supabase/migrations/0001_v1_schema.sql).
2. Create the `tickets` storage bucket.
3. Create the first admin user in Supabase Auth.
4. Insert that UUID into `admin_profiles` with role `owner`.
5. Confirm the seeded `winter-masquerade-ball` event and its ticket tiers.

## Stripe

1. Enable dynamic payment methods.
2. Connect PayPal if required.
3. Add the webhook endpoint:
   - `https://events.jaopulenceevents.co.uk/api/stripe/webhook`
4. Subscribe to:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
5. Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.

## Verification

1. Deploy a preview build.
2. Sign in at `/auth/sign-in` using the owner account.
3. Confirm `/events/winter-masquerade-ball` loads correctly.
4. Run one Stripe test payment.
5. Confirm:
   - one paid order
   - correct guest count
   - correct ticket count
   - ticket PDFs stored in Supabase
   - email delivery logged in `email_deliveries`
6. Only after verification, update the root-site CTAs to the new subdomain app.
