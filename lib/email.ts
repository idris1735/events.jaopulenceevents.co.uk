import { Resend } from "resend";

import { env, getBaseUrl } from "@/lib/env";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

interface SendOrderConfirmationEmailInput {
  orderId: string;
  stripeEventId: string;
  buyerEmail: string;
  buyerName: string;
  eventSlug: string;
  eventName: string;
  tierName: string;
  ticketLinks: Array<{
    publicId: string;
    pdfPath: string | null;
  }>;
}

function isVipTier(tierName: string) {
  return tierName.toLowerCase().includes("vip");
}

function buildTicketButtons(ticketLinks: SendOrderConfirmationEmailInput["ticketLinks"]) {
  return ticketLinks
    .map((ticket, i) => {
      const url   = `${getBaseUrl()}/ticket/${ticket.publicId}`;
      const label = ticketLinks.length === 1
        ? "View &amp; Download Your Ticket"
        : `View &amp; Download Ticket ${i + 1}`;
      return `
        <div style="margin-bottom:14px;">
          <a href="${url}"
             style="display:inline-block;background:#d4af37;color:#070707;font-family:Arial,sans-serif;
                    font-weight:700;font-size:15px;padding:14px 28px;border-radius:6px;
                    text-decoration:none;letter-spacing:0.5px;">
            ${label}
          </a>
          <p style="margin:6px 0 0;font-size:12px;color:#888;">
            Ticket ID: <span style="font-family:monospace;color:#d4af37;">${ticket.publicId}</span>
          </p>
        </div>`;
    })
    .join("");
}

function buildStandardEmail(input: SendOrderConfirmationEmailInput): string {
  const ticketCount = input.ticketLinks.length;
  const ticketWord  = ticketCount === 1 ? "ticket" : "tickets";
  const buttons     = buildTicketButtons(input.ticketLinks);

  return `
    <div style="font-family:Arial,sans-serif;background:#070707;color:#f7f1e1;padding:0;max-width:600px;margin:0 auto;">

      <!-- Header -->
      <div style="background:linear-gradient(135deg,#1a1a1a,#111);padding:32px 36px;border-bottom:2px solid rgba(212,175,55,0.3);">
        <p style="margin:0 0 8px;font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#d4af37;">
          J&amp;A Opulence Events
        </p>
        <h1 style="margin:0;font-family:Georgia,serif;font-size:26px;color:#ffffff;line-height:1.2;">
          Your booking is confirmed
        </h1>
      </div>

      <!-- Body -->
      <div style="padding:32px 36px;">
        <p style="margin:0 0 20px;font-size:16px;color:#f7f1e1;">Hello ${input.buyerName},</p>
        <p style="margin:0 0 28px;font-size:15px;color:#c8bfa8;line-height:1.6;">
          Your payment has been confirmed. You have
          <strong style="color:#f7f1e1;">${ticketCount} ${ticketWord}</strong> for
          <strong style="color:#d4af37;">${input.eventName}</strong>.
          Each ticket below has a unique QR code — tap the button to open it, then download your PDF.
        </p>

        ${buttons}

        <div style="margin:32px 0;padding:20px 24px;background:rgba(212,175,55,0.06);
                    border:1px solid rgba(212,175,55,0.15);border-radius:10px;">
          <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#d4af37;
                    letter-spacing:1px;text-transform:uppercase;">On the night</p>
          <p style="margin:0;font-size:14px;color:#a89e8a;line-height:1.6;">
            Present your PDF ticket (printed or on your phone) at the entrance.
            Staff will scan your QR code to verify entry.
          </p>
        </div>

        <p style="margin:0;font-size:13px;color:#666;line-height:1.6;">
          Questions? Reply to this email or contact us at
          <a href="mailto:${env.RESEND_AUDIENCE_EMAIL}" style="color:#d4af37;">${env.RESEND_AUDIENCE_EMAIL}</a>.
        </p>
      </div>

      <!-- Footer -->
      <div style="padding:20px 36px;border-top:1px solid rgba(255,255,255,0.06);">
        <p style="margin:0;font-size:12px;color:#444;">
          J&amp;A Opulence Events &middot; Tickets delivered by secure QR issuance
        </p>
      </div>

    </div>`;
}

function buildVipEmail(input: SendOrderConfirmationEmailInput): string {
  const ticketCount = input.ticketLinks.length;
  const ticketWord  = ticketCount === 1 ? "ticket" : "tickets";
  const buttons     = buildTicketButtons(input.ticketLinks);

  return `
    <div style="font-family:Arial,sans-serif;background:#040404;color:#f7f1e1;padding:0;max-width:600px;margin:0 auto;">

      <!-- Gold top accent line -->
      <div style="height:4px;background:linear-gradient(90deg,#a07810,#d4af37,#f0d060,#d4af37,#a07810);"></div>

      <!-- Header -->
      <div style="background:linear-gradient(160deg,#100e00,#0a0800,#0f0d01);
                  padding:36px 36px 28px;border-bottom:1px solid rgba(212,175,55,0.25);">
        <p style="margin:0 0 6px;font-size:10px;letter-spacing:5px;text-transform:uppercase;color:#d4af37;">
          J&amp;A Opulence Events
        </p>
        <p style="margin:0 0 12px;font-size:10px;letter-spacing:3px;text-transform:uppercase;
                  color:#a08020;font-style:italic;">
          VIP Experience
        </p>
        <h1 style="margin:0;font-family:Georgia,serif;font-size:28px;color:#ffffff;line-height:1.2;">
          Your VIP booking is confirmed
        </h1>
        <div style="margin-top:16px;height:1px;background:linear-gradient(90deg,rgba(212,175,55,0.6),transparent);"></div>
      </div>

      <!-- Body -->
      <div style="padding:32px 36px;">
        <p style="margin:0 0 20px;font-size:16px;color:#f7f1e1;">
          Dear ${input.buyerName},
        </p>
        <p style="margin:0 0 20px;font-size:15px;color:#c8bfa8;line-height:1.7;">
          Welcome to the VIP Experience at
          <strong style="color:#d4af37;">${input.eventName}</strong>.
          Your payment has been confirmed and you have
          <strong style="color:#ffffff;">${ticketCount} VIP ${ticketWord}</strong> ready to download below.
        </p>

        <!-- VIP perks callout -->
        <div style="margin:0 0 28px;padding:18px 22px;
                    background:linear-gradient(135deg,rgba(212,175,55,0.08),rgba(212,175,55,0.03));
                    border-left:3px solid #d4af37;border-radius:0 8px 8px 0;">
          <p style="margin:0 0 10px;font-size:12px;font-weight:700;color:#d4af37;
                    letter-spacing:1.5px;text-transform:uppercase;">Your VIP Inclusions</p>
          <ul style="margin:0;padding-left:18px;font-size:13px;color:#b0a888;line-height:1.8;">
            <li>Priority entry &amp; dedicated VIP welcome</li>
            <li>Reserved VIP seated service throughout the evening</li>
            <li>3-course plated dinner</li>
            <li>Access to exclusive VIP area</li>
          </ul>
        </div>

        ${buttons}

        <div style="margin:28px 0;padding:18px 22px;background:rgba(212,175,55,0.05);
                    border:1px solid rgba(212,175,55,0.12);border-radius:10px;">
          <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#d4af37;
                    letter-spacing:1px;text-transform:uppercase;">On the night</p>
          <p style="margin:0;font-size:13px;color:#a89e8a;line-height:1.6;">
            Proceed directly to the VIP entrance — present your PDF ticket (printed or on your phone).
            A member of our team will escort you to your reserved area.
          </p>
        </div>

        <p style="margin:0;font-size:13px;color:#555;line-height:1.6;">
          Questions? Reply to this email or contact us at
          <a href="mailto:${env.RESEND_AUDIENCE_EMAIL}" style="color:#d4af37;">${env.RESEND_AUDIENCE_EMAIL}</a>.
        </p>
      </div>

      <!-- Gold bottom accent line -->
      <div style="padding:20px 36px;border-top:1px solid rgba(212,175,55,0.1);">
        <p style="margin:0;font-size:12px;color:#3a3628;">
          J&amp;A Opulence Events &middot; VIP Experience &middot; Secure QR Issuance
        </p>
      </div>
      <div style="height:3px;background:linear-gradient(90deg,#a07810,#d4af37,#f0d060,#d4af37,#a07810);"></div>

    </div>`;
}

export async function sendOrderConfirmationEmail(input: SendOrderConfirmationEmailInput) {
  const supabase = getSupabaseAdminClient();

  if (!env.RESEND_API_KEY || !env.RESEND_AUDIENCE_EMAIL) {
    if (supabase) {
      await supabase.from("email_deliveries").insert({
        order_id:            input.orderId,
        provider:            "resend",
        status:              "skipped",
        recipient_email:     input.buyerEmail,
        provider_message_id: null
      });
    }
    return;
  }

  const resend = new Resend(env.RESEND_API_KEY);

  const vip         = isVipTier(input.tierName);
  const ticketCount = input.ticketLinks.length;
  const ticketWord  = ticketCount === 1 ? "ticket" : "tickets";

  const subject = vip
    ? `Your VIP Experience — ${input.eventName} booking confirmed`
    : `Your ${input.eventName} ${ticketWord} — booking confirmed`;

  const html = vip
    ? buildVipEmail(input)
    : buildStandardEmail(input);

  const result = await resend.emails.send({
    from:    "J&A Opulence Events <tickets@mail.jaopulenceevents.co.uk>",
    to:      input.buyerEmail,
    replyTo: env.RESEND_AUDIENCE_EMAIL,
    subject,
    html
  });

  if (supabase) {
    await supabase.from("email_deliveries").insert({
      order_id:            input.orderId,
      provider:            "resend",
      status:              result.error ? "failed" : "sent",
      recipient_email:     input.buyerEmail,
      provider_message_id: result.error
        ? `ERROR: ${result.error.name} — ${result.error.message}`
        : (result.data?.id ?? input.stripeEventId)
    });
  }

  if (result.error) {
    console.error("[email] Resend send failed:", result.error);
  }
}
