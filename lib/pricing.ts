import { TicketTierRecord } from "@/lib/types";

// Group discount: groups of 10+ pay £70 per ticket.
// Applied automatically at checkout — no promo code needed.
export const GROUP_DISCOUNT_THRESHOLD = 10;
export const GROUP_DISCOUNT_UNIT_PRICE_GBP = 70;

/**
 * The discount applies to single-guest Standard tickets only.
 * VIP tiers and couples/group bundle tiers keep their listed prices.
 */
export function appliesGroupDiscount(
  tier: Pick<TicketTierRecord, "name" | "guests_per_unit">
): boolean {
  return (tier.guests_per_unit ?? 1) === 1 && !tier.name.toLowerCase().includes("vip");
}

export function getUnitPriceGbp(tier: TicketTierRecord, quantity: number): number {
  if (appliesGroupDiscount(tier) && quantity >= GROUP_DISCOUNT_THRESHOLD) {
    return GROUP_DISCOUNT_UNIT_PRICE_GBP;
  }
  return tier.price_gbp;
}
