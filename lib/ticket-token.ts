import crypto from "node:crypto";

import { env } from "@/lib/env";

function getSecret(): string {
  const secret = env.TICKET_SIGNING_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("TICKET_SIGNING_SECRET environment variable is required in production.");
    }
    // Development only — never reaches production
    return "development-ticket-secret-do-not-use-in-prod";
  }
  return secret;
}

export function signTicketToken(payload: string) {
  const signature = crypto
    .createHmac("sha256", getSecret())
    .update(payload)
    .digest("hex");
  return `${payload}.${signature}`;
}

export function verifyTicketToken(token: string) {
  const lastDot = token.lastIndexOf(".");
  if (lastDot === -1) return false;
  const payload   = token.slice(0, lastDot);
  const signature = token.slice(lastDot + 1);
  if (!payload || !signature) return false;

  const expected = crypto
    .createHmac("sha256", getSecret())
    .update(payload)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expected, "hex")
    );
  } catch {
    return false;
  }
}
