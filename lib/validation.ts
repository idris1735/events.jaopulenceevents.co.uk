import { z } from "zod";

export const checkoutPayloadSchema = z.object({
  eventId: z.string().min(1),
  eventSlug: z.string().min(1),
  tierId: z.string().min(1),
  quantity: z.number().int().min(1).max(20),
  buyerName: z.string().min(2),
  buyerEmail: z.string().email(),
  buyerPhone: z.string().min(7)
});
