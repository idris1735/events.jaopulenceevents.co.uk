import { PDFDocument, PDFFont, PDFImage, PDFPage, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";

import { formatDateTime } from "@/lib/utils";

export interface GenerateTicketPdfInput {
  eventName: string;
  guestName: string;
  publicId: string;
  ticketTier: string;
  startsAt: string;
  venueName: string;
  venueAddress: string;
  qrPayload: string;
  guestIndex?: number;
  totalGuests?: number;
}

// ─── Palette ─────────────────────────────────────────────────────────────────
const GOLD     = rgb(0.83, 0.68, 0.22);
const GOLD_L   = rgb(0.95, 0.87, 0.54);
const GOLD_DIM = rgb(0.42, 0.33, 0.08);
const WHITE    = rgb(1, 1, 1);
const CREAM    = rgb(0.97, 0.94, 0.89);
const MUTED    = rgb(0.62, 0.58, 0.52);
const DIM      = rgb(0.38, 0.35, 0.30);

// ─── Tier helpers ─────────────────────────────────────────────────────────────
function isVip(tier: string)     { return tier.toLowerCase().includes("vip"); }
function isCouples(tier: string) { return tier.toLowerCase().includes("couples"); }
function isGroup(tier: string)   { return tier.toLowerCase().includes("group"); }
function isBundle(tier: string)  { return isCouples(tier) || isGroup(tier); }

function bundleMemberLabel(tier: string, index: number, total: number): string {
  if (isCouples(tier)) return `Couple ${index} of ${total}`;
  return `Guest ${index} of ${total}`;
}

function badgeLabel(tier: string): string {
  if (isGroup(tier))   return isVip(tier) ? "VIP · GROUP OF 10" : "GROUP OF 10";
  if (isCouples(tier)) return isVip(tier) ? "VIP · COUPLES"     : "COUPLES";
  return isVip(tier) ? "VIP" : "STANDARD";
}

// If the venue address is still a placeholder, omit it
function resolveAddress(addr: string): string | null {
  if (!addr || addr.toLowerCase().includes("will be released") || addr.toLowerCase().includes("to be confirmed")) {
    return null;
  }
  return addr.length > 52 ? addr.slice(0, 49) + "..." : addr;
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function drawTearLine(page: PDFPage, x: number) {
  const dashH = 5, gapH = 5;
  let y = 412;
  while (y > 8) {
    page.drawRectangle({ x: x - 0.5, y: y - dashH, width: 1, height: dashH, color: GOLD_DIM });
    y -= dashH + gapH;
  }
  page.drawCircle({ x, y: 410, size: 3, color: GOLD_DIM });
  page.drawCircle({ x, y: 10,  size: 3, color: GOLD_DIM });
}

function drawSeal(page: PDFPage, serif: PDFFont, sans: PDFFont, cx: number, cy: number) {
  page.drawCircle({ x: cx, y: cy, size: 36,  borderColor: GOLD, borderWidth: 1.2 });
  page.drawCircle({ x: cx, y: cy, size: 31,  borderColor: GOLD_DIM, borderWidth: 0.5 });

  const ja  = "J&A";
  const jaS = 15;
  page.drawText(ja, { x: cx - serif.widthOfTextAtSize(ja, jaS) / 2, y: cy + 3, size: jaS, font: serif, color: GOLD });

  const op  = "OPULENCE";
  const opS = 5.5;
  page.drawText(op, { x: cx - sans.widthOfTextAtSize(op, opS) / 2, y: cy - 9,  size: opS, font: sans, color: GOLD });
  const ev  = "EVENTS";
  page.drawText(ev, { x: cx - sans.widthOfTextAtSize(ev, opS) / 2, y: cy - 17, size: opS, font: sans, color: GOLD });
}

function drawBadge(
  page: PDFPage, font: PDFFont, label: string,
  x: number, y: number, bg: ReturnType<typeof rgb>, fg: ReturnType<typeof rgb>
): number {
  const sz = 8, padX = 8, padY = 5;
  const tw = font.widthOfTextAtSize(label, sz);
  const bw = tw + padX * 2;
  page.drawRectangle({ x, y, width: bw, height: sz + padY * 2, color: bg });
  page.drawText(label, { x: x + padX, y: y + padY + 1, size: sz, font, color: fg });
  return bw;
}

function drawQrPanel(
  page: PDFPage, sans: PDFFont, sansBold: PDFFont,
  qrImage: PDFImage, publicId: string, gold: ReturnType<typeof rgb>
) {
  const qrX = 507, qrY = 135, qrS = 148;
  page.drawImage(qrImage, { x: qrX, y: qrY, width: qrS, height: qrS });

  const scanLabel = "SCAN AT ENTRY";
  const slW = sansBold.widthOfTextAtSize(scanLabel, 7.5);
  page.drawText(scanLabel, { x: qrX + qrS / 2 - slW / 2, y: qrY - 18, size: 7.5, font: sansBold, color: gold });

  const idLabel = `ID: ${publicId}`;
  const idW = sans.widthOfTextAtSize(idLabel, 7);
  page.drawText(idLabel, { x: qrX + qrS / 2 - idW / 2, y: qrY - 31, size: 7, font: sans, color: MUTED });
}

// ─── Left panel text block — shared between Standard and VIP ─────────────────
// Returns the y position reached after all text is drawn.
function drawLeftText(
  page: PDFPage,
  serif: PDFFont, sans: PDFFont, sansBold: PDFFont,
  input: GenerateTicketPdfInput,
  startY: number,       // y position of the event name baseline
  brandY: number,       // y position of the brand label
  ruleAfterBrand: number,
  gold: ReturnType<typeof rgb>,
  goldL: ReturnType<typeof rgb>
): number {
  const X = 36;
  const TEAR = 490;

  // Brand label
  page.drawText("J&A OPULENCE EVENTS", { x: X, y: brandY, size: 9, font: sansBold, color: gold });
  page.drawRectangle({ x: X, y: ruleAfterBrand, width: 200, height: 0.5, color: GOLD_DIM });

  // Event name — clamp to fit left panel (max ~430px), truncate if needed
  const evRaw  = input.eventName.toUpperCase();
  const evSize = 22;
  const maxEvW = TEAR - 80;
  let evName   = evRaw;
  while (evName.length > 4 && sans.widthOfTextAtSize(evName, evSize) > maxEvW) {
    evName = evName.slice(0, -1);
  }
  if (evName !== evRaw) evName = evName.trimEnd() + "...";
  page.drawText(evName, { x: X, y: startY, size: evSize, font: serif, color: WHITE });

  const ruleY = startY - 9;
  page.drawRectangle({ x: X, y: ruleY, width: TEAR - 80, height: 0.5, color: GOLD_DIM });

  // Guest name — truncate if too long
  const gnSize = 12;
  const gnMaxW = TEAR - 80;
  let gn       = input.guestName;
  while (gn.length > 4 && sansBold.widthOfTextAtSize(gn, gnSize) > gnMaxW) {
    gn = gn.slice(0, -1);
  }
  if (gn !== input.guestName) gn = gn.trimEnd() + "...";

  const gnY = startY - 32;
  page.drawText(gn, { x: X, y: gnY, size: gnSize, font: sansBold, color: CREAM });

  let y = gnY - 20;

  // Bundle: couple/guest label
  if (isBundle(input.ticketTier) && input.guestIndex && input.totalGuests) {
    const lbl = bundleMemberLabel(input.ticketTier, input.guestIndex, input.totalGuests);
    page.drawText(lbl, { x: X, y, size: 9.5, font: sans, color: goldL });
    y -= 18;
  }

  // Tier name
  page.drawText(input.ticketTier, { x: X, y, size: 9.5, font: sans, color: gold });
  y -= 18;

  // Date
  const dateStr = formatDateTime(input.startsAt);
  page.drawText(dateStr, { x: X, y, size: 9.5, font: sans, color: MUTED });
  y -= 18;

  // Venue name
  page.drawText(input.venueName, { x: X, y, size: 9.5, font: sans, color: MUTED });
  y -= 16;

  // Venue address (omit placeholder text)
  const addr = resolveAddress(input.venueAddress);
  if (addr) {
    page.drawText(addr, { x: X, y, size: 8.5, font: sans, color: DIM });
  }

  return y;
}

// ─── Standard design ──────────────────────────────────────────────────────────
function drawStandardDesign(
  page: PDFPage, serif: PDFFont, sans: PDFFont, sansBold: PDFFont,
  input: GenerateTicketPdfInput, qrImage: PDFImage
) {
  const W = 720, H = 420, TEAR = 490;
  const bundle = isBundle(input.ticketTier);

  // Background
  const bg = bundle ? rgb(0.06, 0.03, 0.06) : rgb(0.04, 0.04, 0.09);
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: bg });

  // Left gold accent strip
  page.drawRectangle({ x: 0, y: 0, width: 5, height: H, color: GOLD });

  // Single border
  page.drawRectangle({ x: 16, y: 16, width: TEAR - 30, height: H - 32, borderColor: GOLD, borderWidth: 0.8 });

  // Tear line + right panel
  drawTearLine(page, TEAR);
  page.drawRectangle({ x: TEAR + 1, y: 0, width: W - TEAR - 1, height: H, color: rgb(0.06, 0.06, 0.10) });

  // Left text block
  drawLeftText(page, serif, sans, sansBold, input, 310, 370, 363, GOLD, GOLD_L);

  // Badge
  drawBadge(page, sansBold, badgeLabel(input.ticketTier), TEAR - 140, 28, GOLD, rgb(0.04, 0.04, 0.06));

  // Seal
  drawSeal(page, serif, sans, 68, 56);

  // QR
  drawQrPanel(page, sans, sansBold, qrImage, input.publicId, GOLD);
}

// ─── VIP design ───────────────────────────────────────────────────────────────
function drawVipDesign(
  page: PDFPage, serif: PDFFont, sans: PDFFont, sansBold: PDFFont,
  input: GenerateTicketPdfInput, qrImage: PDFImage
) {
  const W = 720, H = 420, TEAR = 490;

  // Background
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: rgb(0.02, 0.02, 0.02) });

  // Subtle diagonal gold line pattern (left panel only)
  for (let i = -H; i < TEAR + H; i += 28) {
    page.drawLine({
      start: { x: i, y: 0 }, end: { x: i + H, y: H },
      thickness: 0.4, color: rgb(0.18, 0.14, 0.03), opacity: 0.5
    });
  }

  // Gold header strip
  page.drawRectangle({ x: 0, y: H - 46, width: TEAR, height: 46, color: rgb(0.12, 0.10, 0.01) });
  page.drawRectangle({ x: 0, y: H - 48, width: TEAR, height: 2,  color: GOLD });

  // "VIP EXPERIENCE" in header
  const vipLbl = "VIP EXPERIENCE";
  page.drawText(vipLbl, { x: 36, y: H - 33, size: 12, font: sansBold, color: GOLD_L });
  const vipLblW = sansBold.widthOfTextAtSize(vipLbl, 12);
  page.drawRectangle({ x: 36 + vipLblW + 12, y: H - 26, width: TEAR - 36 - vipLblW - 55, height: 0.5, color: GOLD_DIM });

  // Double border
  page.drawRectangle({ x: 14, y: 14, width: TEAR - 28, height: H - 28, borderColor: GOLD,    borderWidth: 1.2 });
  page.drawRectangle({ x: 20, y: 20, width: TEAR - 40, height: H - 40, borderColor: GOLD_DIM, borderWidth: 0.4 });

  // Corner diamonds
  for (const c of [{ x: 20, y: 20 }, { x: TEAR - 20, y: 20 }, { x: 20, y: H - 20 }, { x: TEAR - 20, y: H - 20 }]) {
    page.drawCircle({ x: c.x, y: c.y, size: 4, color: GOLD });
  }

  // Tear line + right panel
  drawTearLine(page, TEAR);
  page.drawRectangle({ x: TEAR + 1, y: 0,      width: W - TEAR - 1, height: H,  color: rgb(0.04, 0.03, 0.01) });
  page.drawRectangle({ x: TEAR + 1, y: H - 48, width: W - TEAR - 1, height: 48, color: rgb(0.10, 0.08, 0.01) });

  // Left text block — starts below the header strip (H-48=372, so event name at ~316)
  drawLeftText(page, serif, sans, sansBold, input, 316, 378, 371, GOLD, GOLD_L);

  // Badge
  drawBadge(page, sansBold, badgeLabel(input.ticketTier), TEAR - 150, 28, GOLD, rgb(0, 0, 0));

  // Seal
  drawSeal(page, serif, sans, 68, 56);

  // QR
  drawQrPanel(page, sans, sansBold, qrImage, input.publicId, GOLD_L);
}

// ─── Entry point ──────────────────────────────────────────────────────────────
export async function generateTicketPdf(input: GenerateTicketPdfInput) {
  const pdf      = await PDFDocument.create();
  const page     = pdf.addPage([720, 420]);
  const serif    = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const sans     = await pdf.embedFont(StandardFonts.Helvetica);
  const sansBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const vip = isVip(input.ticketTier);

  const qrDataUrl = await QRCode.toDataURL(input.qrPayload, {
    margin: 1,
    color: { dark: "#111111", light: vip ? "#f0e6c0" : "#f4e8c1" }
  });
  const qrImage = await pdf.embedPng(qrDataUrl);

  if (vip) {
    drawVipDesign(page, serif, sans, sansBold, input, qrImage);
  } else {
    drawStandardDesign(page, serif, sans, sansBold, input, qrImage);
  }

  return await pdf.save();
}
