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

export type QuoteCardOrientation = "portrait" | "landscape";

interface OrientationSpec {
  width: number;
  height: number;
  padding: number;
  headerHeight: number;
  footerHeight: number;
  footerGap: number;
  baseBodySize: number;
  minBodySize: number;
  maxTextWidth: number;
}

const ORIENTATION_SPEC: Record<QuoteCardOrientation, OrientationSpec> = {
  portrait: {
    width: 1080,
    height: 1920,
    padding: 88,
    headerHeight: 112,
    footerHeight: 168,
    footerGap: 56,
    baseBodySize: 54,
    minBodySize: 28,
    maxTextWidth: 1080 - 88 * 2,
  },
  landscape: {
    width: 1920,
    height: 1080,
    padding: 96,
    headerHeight: 96,
    footerHeight: 152,
    footerGap: 48,
    baseBodySize: 48,
    minBodySize: 24,
    maxTextWidth: 1920 - 96 * 2,
  },
};

export interface QuoteCardInput {
  content: string;
  bookTitle: string;
  bookAuthor: string;
  pageNumber: number | null;
  chapter: string | null;
  personalNote: string | null;
  tags: string[];
}

const FALLBACK_SANS = '"Archivo", system-ui, sans-serif';
const FALLBACK_MONO = '"IBM Plex Mono", ui-monospace, monospace';
const FALLBACK_SERIF = '"Lora", Georgia, "Times New Roman", serif';

const PAPER = "#ffffff";
const INK = "#0a0a0a";
const MUTED = "#5f6779";
const NEON = "#d8ff00";
const LINE = "rgba(10,10,10,0.16)";

interface ResolvedFonts {
  sans: string;
  mono: string;
  serif: string;
}

function readCssFont(variableName: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(variableName)
    .trim();
  return value ? `${value}, ${fallback}` : fallback;
}

async function resolveFonts(): Promise<ResolvedFonts> {
  const fonts: ResolvedFonts = {
    sans: readCssFont("--font-archivo", FALLBACK_SANS),
    mono: readCssFont("--font-plex-mono", FALLBACK_MONO),
    serif: readCssFont("--font-lora-raw", FALLBACK_SERIF),
  };

  if (typeof document !== "undefined" && "fonts" in document) {
    const primarySerif = fonts.serif.split(",")[0]?.trim();
    const primarySans = fonts.sans.split(",")[0]?.trim();
    const primaryMono = fonts.mono.split(",")[0]?.trim();
    await Promise.allSettled([
      document.fonts.ready,
      primarySerif ? document.fonts.load(`500 48px ${primarySerif}`) : null,
      primarySans ? document.fonts.load(`800 34px ${primarySans}`) : null,
      primaryMono ? document.fonts.load(`500 24px ${primaryMono}`) : null,
    ]);
  }

  return fonts;
}

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
  const lines: string[] = [];
  const paragraphs = text.split(/\r?\n/).filter((p) => p.trim().length > 0);

  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean);
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
  }

  return lines;
}

function fitLayout(
  ctx: CanvasRenderingContext2D,
  input: QuoteCardInput,
  spec: OrientationSpec,
  fonts: ResolvedFonts,
): { lines: Line[]; bodySize: number; quoteMarkHeight: number; totalHeight: number } {
  const availableHeight =
    spec.height -
    spec.padding * 2 -
    spec.headerHeight -
    spec.footerGap -
    spec.footerHeight;

  let bodySize = spec.baseBodySize;
  let resultLines: Line[] = [];
  let quoteMarkHeight = Math.round(bodySize * 1.1);
  let totalHeight = 0;

  while (bodySize >= spec.minBodySize) {
    const lines: Line[] = [];
    const bodyFont = `400 ${bodySize}px ${fonts.serif}`;
    const bodyLineHeight = Math.round(bodySize * 1.44);

    for (const text of wrap(ctx, input.content, bodyFont, spec.maxTextWidth)) {
      lines.push({
        text,
        font: bodyFont,
        size: bodySize,
        color: INK,
        lineHeight: bodyLineHeight,
        gapBefore: 0,
      });
    }

    if (input.personalNote) {
      const noteSize = Math.max(20, Math.round(bodySize * 0.56));
      const noteFont = `400 ${noteSize}px ${fonts.sans}`;
      const noteLineHeight = Math.round(noteSize * 1.44);
      const wrapped = wrap(ctx, input.personalNote, noteFont, spec.maxTextWidth - 34);
      wrapped.forEach((text, index) => {
        lines.push({
          text,
          font: noteFont,
          size: noteSize,
          color: MUTED,
          lineHeight: noteLineHeight,
          gapBefore: index === 0 ? Math.round(bodySize * 0.8) : 0,
        });
      });
    }

    quoteMarkHeight = Math.round(bodySize * 1.1);
    const bodyHeight = lines.reduce(
      (sum, line) => sum + line.lineHeight + line.gapBefore,
      0,
    );
    totalHeight = quoteMarkHeight + bodyHeight;
    resultLines = lines;

    if (totalHeight <= availableHeight || bodySize <= spec.minBodySize) {
      break;
    }
    bodySize -= 2;
  }

  return { lines: resultLines, bodySize, quoteMarkHeight, totalHeight };
}

/** Renders the card in portrait (mobile) or landscape orientation as a PNG blob. */
export async function renderQuoteCard(
  input: QuoteCardInput,
  orientation: QuoteCardOrientation = "portrait",
): Promise<Blob> {
  const scale = 2;
  const spec = ORIENTATION_SPEC[orientation];
  const fonts = await resolveFonts();
  const measure = document.createElement("canvas").getContext("2d");
  if (!measure) throw new Error("Canvas tidak tersedia di browser ini.");

  const { lines, bodySize, quoteMarkHeight, totalHeight } = fitLayout(
    measure,
    input,
    spec,
    fonts,
  );

  const canvas = document.createElement("canvas");
  canvas.width = spec.width * scale;
  canvas.height = spec.height * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas tidak tersedia di browser ini.");
  ctx.scale(scale, scale);

  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, spec.width, spec.height);

  // Margin rule: the "marginalia" motif, a single neon tick in the header.
  ctx.fillStyle = NEON;
  ctx.fillRect(spec.padding, spec.padding, 56, 10);

  ctx.fillStyle = MUTED;
  ctx.font = `500 22px ${fonts.mono}`;
  ctx.textBaseline = "alphabetic";
  ctx.fillText("MARGINALIA", spec.padding + 76, spec.padding + 11);

  const place = [
    input.pageNumber ? `Hal. ${input.pageNumber}` : null,
    input.chapter,
  ]
    .filter(Boolean)
    .join(" · ");

  if (place) {
    ctx.textAlign = "right";
    ctx.fillText(place.toUpperCase(), spec.width - spec.padding, spec.padding + 11);
    ctx.textAlign = "left";
  }

  const footerTop = spec.height - spec.padding - spec.footerHeight;
  const availableTop = spec.padding + spec.headerHeight;
  const availableHeight = footerTop - spec.footerGap - availableTop;
  const blockTop = Math.max(
    availableTop,
    availableTop + Math.round((availableHeight - totalHeight) * 0.45),
  );

  // Opening quote mark, sized to the serif body it introduces.
  ctx.fillStyle = INK;
  ctx.textBaseline = "top";
  ctx.font = `600 ${Math.round(bodySize * 1.65)}px ${fonts.serif}`;
  ctx.fillText("\u201C", spec.padding - 4, blockTop - Math.round(bodySize * 0.25));

  let cursor = blockTop + quoteMarkHeight;
  for (const line of lines) {
    cursor += line.gapBefore;
    if (line.color === MUTED) {
      // Personal note: a hairline rule, then the text indented past it.
      ctx.fillStyle = LINE;
      ctx.fillRect(spec.padding, cursor + 3, 4, line.lineHeight - 8);
    }
    ctx.font = line.font;
    ctx.fillStyle = line.color;
    ctx.fillText(
      line.text,
      line.color === MUTED ? spec.padding + 34 : spec.padding,
      cursor,
    );
    cursor += line.lineHeight;
  }

  ctx.textBaseline = "alphabetic";
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(spec.padding, footerTop);
  ctx.lineTo(spec.width - spec.padding, footerTop);
  ctx.stroke();

  const metaFont = `500 24px ${fonts.mono}`;
  ctx.font = metaFont;

  let tagX = spec.width - spec.padding;
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

  const titleFont = `800 34px ${fonts.sans}`;
  const titleLines = wrap(
    ctx,
    input.bookTitle,
    titleFont,
    Math.max(240, tagX - spec.padding),
  ).slice(0, 2);

  ctx.fillStyle = INK;
  ctx.font = titleFont;
  const titleBase = footerTop + 54;
  titleLines.forEach((text, index) => {
    ctx.fillText(text, spec.padding, titleBase + index * 42);
  });

  ctx.font = metaFont;
  ctx.fillStyle = MUTED;
  ctx.fillText(
    input.bookAuthor.toUpperCase(),
    spec.padding,
    titleBase + (titleLines.length - 1) * 42 + 44,
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

export function cardFilename(
  input: QuoteCardInput,
  orientation: QuoteCardOrientation = "portrait",
): string {
  const slug = input.bookTitle
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `marginalia-${slug || "kutipan"}-${orientation}.png`;
}
