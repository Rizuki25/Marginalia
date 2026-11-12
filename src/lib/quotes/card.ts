/**
 * Quote card renderer.
 *
 * Drawn with the Canvas 2D API rather than a DOM screenshot library: one file,
 * no dependency, and the fonts are already loaded by the page (the card is
 * rendered from a click, so `document.fonts` is warm).
 *
 * The card is deliberately theme-independent: it is an exported image, so it
 * uses the light palette in both themes. Exporting a dark card because the app
 * happened to be dark would surprise the person sharing it.
 */

const WIDTH = 1080;
const PADDING = 96;
const FOOTER_GAP = 72;

export interface QuoteCardInput {
  content: string;
  bookTitle: string;
  bookAuthor: string;
  pageNumber: number | null;
  chapter: string | null;
  personalNote: string | null;
  tags: string[];
}

const SANS = '"Archivo", system-ui, sans-serif';
const MONO = '"IBM Plex Mono", ui-monospace, monospace';

const PAPER = "#ffffff";
const INK = "#0a0a0a";
const MUTED = "#5f6779";
const NEON = "#d8ff00";
const LINE = "rgba(10,10,10,0.16)";

interface Line {
  text: string;
  font: string;
  size: number;
  color: string;
  lineHeight: number;
  gapBefore: number;
}

function wrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  font: string,
  maxWidth: number,
): string[] {
  ctx.font = font;
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current === "" ? word : `${current} ${word}`;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      if (current !== "") lines.push(current);
      current = word;
    }
  }
  if (current !== "") lines.push(current);
  return lines;
}

function layout(ctx: CanvasRenderingContext2D, input: QuoteCardInput): Line[] {
  const inner = WIDTH - PADDING * 2;
  const lines: Line[] = [];

  const bodyFont = `500 46px ${SANS}`;
  for (const text of wrap(ctx, input.content, bodyFont, inner)) {
    lines.push({
      text,
      font: bodyFont,
      size: 46,
      color: INK,
      lineHeight: 62,
      gapBefore: 0,
    });
  }

  if (input.personalNote) {
    const noteFont = `400 26px ${SANS}`;
    const wrapped = wrap(ctx, input.personalNote, noteFont, inner - 34);
    wrapped.forEach((text, index) => {
      lines.push({
        text,
        font: noteFont,
        size: 26,
        color: MUTED,
        lineHeight: 38,
        gapBefore: index === 0 ? 44 : 0,
      });
    });
  }

  return lines;
}

/** Renders the card and returns it as a PNG blob. */
export async function renderQuoteCard(
  input: QuoteCardInput,
): Promise<Blob> {
  const scale = 2;
  const measure = document.createElement("canvas").getContext("2d");
  if (!measure) throw new Error("Canvas tidak tersedia di browser ini.");

  const lines = layout(measure, input);
  const bodyHeight = lines.reduce(
    (sum, line) => sum + line.lineHeight + line.gapBefore,
    0,
  );

  const headerHeight = 150;
  const footerHeight = 160;
  const height = Math.round(
    PADDING * 2 + headerHeight + bodyHeight + FOOTER_GAP + footerHeight,
  );

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas tidak tersedia di browser ini.");
  ctx.scale(scale, scale);

  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, WIDTH, height);

  // Margin rule: the "marginalia" motif, a single neon tick in the header.
  ctx.fillStyle = NEON;
  ctx.fillRect(PADDING, PADDING, 56, 10);

  ctx.fillStyle = MUTED;
  ctx.font = `500 22px ${MONO}`;
  ctx.textBaseline = "alphabetic";
  ctx.fillText("MARGINALIA", PADDING + 76, PADDING + 11);

  const place = [
    input.pageNumber ? `Hal. ${input.pageNumber}` : null,
    input.chapter,
  ]
    .filter(Boolean)
    .join(" · ");

  if (place) {
    ctx.textAlign = "right";
    ctx.fillText(place.toUpperCase(), WIDTH - PADDING, PADDING + 11);
    ctx.textAlign = "left";
  }

  // Opening quote mark, sized to the body it introduces.
  ctx.fillStyle = INK;
  ctx.font = `800 84px ${SANS}`;
  ctx.fillText("\u201C", PADDING - 4, PADDING + headerHeight + 50);

  let cursor = PADDING + headerHeight + 40;
  for (const line of lines) {
    cursor += line.gapBefore;
    if (line.color === MUTED) {
      // Personal note: a hairline rule, then the text indented past it.
      ctx.fillStyle = LINE;
      ctx.fillRect(PADDING, cursor - 26, 4, line.lineHeight - 6);
    }
    ctx.font = line.font;
    ctx.fillStyle = line.color;
    ctx.fillText(
      line.text,
      line.color === MUTED ? PADDING + 34 : PADDING,
      cursor + 34,
    );
    cursor += line.lineHeight;
  }

  const footerTop = height - PADDING - footerHeight;

  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(PADDING, footerTop);
  ctx.lineTo(WIDTH - PADDING, footerTop);
  ctx.stroke();

  const metaFont = `500 24px ${MONO}`;
  ctx.font = metaFont;

  let tagX = WIDTH - PADDING;
  if (input.tags.length > 0) {
    const label = input.tags
      .slice(0, 3)
      .map((tag: string) => `#${tag}`)
      .join("  ");
    const width = ctx.measureText(label).width;
    ctx.textAlign = "right";
    ctx.fillStyle = MUTED;
    ctx.fillText(label, tagX, footerTop + 52);
    ctx.textAlign = "left";
    tagX -= width + 24;
  }

  const titleFont = `800 34px ${SANS}`;
  const titleLines = wrap(
    ctx,
    input.bookTitle,
    titleFont,
    Math.max(240, tagX - PADDING),
  ).slice(0, 2);

  ctx.fillStyle = INK;
  ctx.font = titleFont;
  const titleBase = footerTop + 54;
  titleLines.forEach((text, index) => {
    ctx.fillText(text, PADDING, titleBase + index * 42);
  });

  ctx.font = metaFont;
  ctx.fillStyle = MUTED;
  ctx.fillText(
    input.bookAuthor.toUpperCase(),
    PADDING,
    titleBase + (titleLines.length - 1) * 42 + 42,
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Gagal membuat gambar."));
    }, "image/png");
  });
}

/** Chrome 86+, Firefox 85+, Safari 15+: the plain anchor download. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function cardFilename(input: QuoteCardInput): string {
  const slug = input.bookTitle
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `marginalia-${slug || "kutipan"}.png`;
}
