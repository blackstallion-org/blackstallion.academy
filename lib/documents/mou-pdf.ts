import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { z } from "zod";
import { mouDraft, type MouDraftInput } from "@/lib/content/mou";

/**
 * A4 PDF of the draft MOU in BSAH's palette. Uses the PDF standard fonts (no font files to ship); characters they
 * cannot encode (e.g. ₹, curly quotes) are mapped to safe equivalents. Clearly marked as a non-binding draft; the
 * signature blocks are left empty: nothing is signed or approved by generating this file.
 */
export const mouDraftSchema = z.object({
  school: z.string().trim().min(2, "Enter the school name").max(160),
  city: z.string().trim().max(80).default(""),
  trustee: z.string().trim().min(2, "Enter the trustee or principal").max(120),
  designation: z.string().trim().max(120).default(""),
  email: z.string().trim().max(160).default(""),
  phone: z.string().trim().max(24).default(""),
  land: z.string().trim().max(12).regex(/^(\d{1,3}(\.\d{1,2})?)?$/, "Land in acres, e.g. 1.5").default(""),
  tier: z.enum(["standard", "signature", "royal"]),
  cadets: z.string().trim().max(5).regex(/^\d{0,5}$/, "Cadets as a whole number").default(""),
});

const INK = rgb(0.188, 0.145, 0.118); // #30251E
const SAND = rgb(0.302, 0.235, 0.188); // #4D3C30
const CHESTNUT = rgb(0.471, 0.278, 0.184); // #78472F
const BLOOD = rgb(0.55, 0.16, 0.12);
const RULE = rgb(0.72, 0.54, 0.38); // caramel

/** WinAnsi-safe text for the standard fonts. */
export function pdfSafe(s: string) {
  return s
    .replace(/₹\s?/g, "INR ")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/·/g, "-")
    .replace(/…/g, "...")
    .replace(/[^\x20-\x7E\n]/g, "");
}

function wrap(text: string, font: PDFFont, size: number, width: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(next, size) > width && line) {
      lines.push(line);
      line = w;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

export async function buildMouPdf(input: MouDraftInput, meta: { generatedAt: Date; reference?: string }) {
  const d = mouDraft(input);
  const pdf = await PDFDocument.create();
  pdf.setTitle(pdfSafe(`${d.title} (draft) - ${input.school}`));
  pdf.setAuthor("The Black Stallion Academy of Horsemanship");
  pdf.setSubject("Draft for discussion - not a binding document");
  pdf.setCreator("blackstallion.academy");
  pdf.setCreationDate(meta.generatedAt);

  const serif = await pdf.embedFont(StandardFonts.TimesRoman);
  const serifBold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const sans = await pdf.embedFont(StandardFonts.Helvetica);
  const sansBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const W = 595.28, H = 841.89, M = 64, contentW = W - M * 2;
  let page: PDFPage = pdf.addPage([W, H]);
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: rgb(0.984, 0.973, 0.945) });
  let y = H - M;

  const center = (text: string, font: PDFFont, size: number, color = INK) => {
    const t = pdfSafe(text);
    page.drawText(t, { x: (W - font.widthOfTextAtSize(t, size)) / 2, y, size, font, color });
  };

  center("THE BLACK STALLION ACADEMY OF HORSEMANSHIP", sansBold, 8.5, CHESTNUT);
  y -= 22;
  center(d.banner.toUpperCase(), sansBold, 8, BLOOD);
  y -= 34;
  center(d.title.toUpperCase(), serif, 22, INK);
  y -= 20;
  center(meta.generatedAt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" }), serif, 11, SAND);
  y -= 16;
  page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 0.6, color: RULE });
  y -= 28;

  const size = 11.5, leading = 16.5;
  for (const p of d.paragraphs) {
    const body = pdfSafe(p.lead ? `${p.lead} ${p.text}` : p.text);
    const lines = wrap(body, serif, size, contentW);
    if (y - lines.length * leading < M + 140) {
      page = pdf.addPage([W, H]);
      page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: rgb(0.984, 0.973, 0.945) });
      y = H - M;
    }
    lines.forEach((line, i) => {
      if (i === 0 && p.lead) {
        const lead = pdfSafe(p.lead);
        page.drawText(lead, { x: M, y, size, font: serifBold, color: INK });
        page.drawText(line.slice(lead.length), { x: M + serifBold.widthOfTextAtSize(lead, size), y, size, font: serif, color: INK });
      } else page.drawText(line, { x: M, y, size, font: serif, color: INK });
      y -= leading;
    });
    y -= 8;
  }

  // Signature blocks are deliberately left unsigned.
  y -= 40;
  const colW = (contentW - 32) / 2;
  d.signatories.forEach((s, i) => {
    const x = M + i * (colW + 32);
    page.drawLine({ start: { x, y }, end: { x: x + colW, y }, thickness: 0.6, color: INK });
    page.drawText(pdfSafe(s.name), { x, y: y - 15, size: 10.5, font: serif, color: INK });
    page.drawText(pdfSafe(s.org), { x, y: y - 29, size: 10, font: serif, color: SAND });
  });
  y -= 70;
  center(d.contact, sans, 8, SAND);

  const footer = pdfSafe(`Generated ${meta.generatedAt.toISOString().slice(0, 10)}${meta.reference ? ` - ref ${meta.reference.slice(0, 12)}` : ""} - draft only; not an offer, contract or approval.`);
  for (const pg of pdf.getPages()) pg.drawText(footer, { x: M, y: 36, size: 7.5, font: sans, color: SAND });

  return pdf.save();
}
