/**
 * Pixel marquee.
 *
 * Each word is drawn as pixel letters rather than text: every filled cell is one
 * `box-shadow` copy of a cell-sized element, so a whole letter is a single DOM
 * node. That keeps the strip light (about 80 nodes instead of 1500) while the
 * letterforms stay real pixels.
 *
 * Colour: each letter gets a dominant colour from the DESIGN.md support palette,
 * with accent cells mixed in, which is what makes the strip read as a pixel
 * mosaic instead of coloured text. The mix is a deterministic hash of the cell,
 * so server and client render the same mosaic.
 *
 * Metrics are explicit: a letter's width is its glyph's used columns and its
 * height is its row count, both in `--px` cells. Nothing depends on how a glyph
 * overflows its box, which is what keeps word spacing even.
 *
 * The glyph set covers only the letters the five words use.
 */

const FONT: Record<string, string[]> = {
  A: [" ### ", "#   #", "#   #", "#####", "#   #", "#   #", "#   #"],
  B: ["#### ", "#   #", "#   #", "#### ", "#   #", "#   #", "#### "],
  C: [" ### ", "#   #", "#    ", "#    ", "#    ", "#   #", " ### "],
  D: ["#### ", "#   #", "#   #", "#   #", "#   #", "#   #", "#### "],
  E: ["#####", "#    ", "#    ", "#### ", "#    ", "#    ", "#####"],
  G: [" ### ", "#   #", "#    ", "#  ##", "#   #", "#   #", " ### "],
  H: ["#   #", "#   #", "#   #", "#####", "#   #", "#   #", "#   #"],
  I: ["#####", "  #  ", "  #  ", "  #  ", "  #  ", "  #  ", "#####"],
  L: ["#    ", "#    ", "#    ", "#    ", "#    ", "#    ", "#####"],
  M: ["#   #", "## ##", "# # #", "#   #", "#   #", "#   #", "#   #"],
  N: ["#   #", "##  #", "# # #", "#  ##", "#   #", "#   #", "#   #"],
  P: ["#### ", "#   #", "#   #", "#### ", "#    ", "#    ", "#    "],
  S: [" ####", "#    ", "#    ", " ### ", "    #", "    #", "#### "],
  T: ["#####", "  #  ", "  #  ", "  #  ", "  #  ", "  #  ", "  #  "],
  U: ["#   #", "#   #", "#   #", "#   #", "#   #", "#   #", " ### "],
};

const PALETTE = ["var(--neon)", "var(--warm)", "var(--red)", "var(--navy)"] as const;

function noise(seed: number): number {
  const value = Math.sin(seed) * 10000;
  return value - Math.floor(value);
}

function pickColor(seed: number, row: number, col: number, base: number): string {
  const keep = noise(seed * 97 + row * 13.7 + col * 7.3);
  // Most cells keep the letter's dominant colour; the rest are accents.
  if (keep < 0.7) return PALETTE[base];

  const accent = noise(seed * 31 + row * 5.1 + col * 2.9);
  const offset = accent < 0.42 ? 1 : accent < 0.74 ? 2 : 3;
  return PALETTE[(base + offset) % PALETTE.length];
}

interface Letter {
  width: number;
  height: number;
  shadows: string;
}

/** Trims unused columns so a narrow glyph gets even side bearings. */
function buildLetter(char: string, seed: number, base: number): Letter | null {
  const glyph = FONT[char];
  if (!glyph) return null;

  const filled: Array<{ x: number; y: number }> = [];
  glyph.forEach((row, y) => {
    [...row].forEach((cell, x) => {
      if (cell === "#") filled.push({ x, y });
    });
  });
  if (filled.length === 0) return null;

  const minX = Math.min(...filled.map((cell) => cell.x));
  const maxX = Math.max(...filled.map((cell) => cell.x));

  const shadows = filled.map(({ x, y }) => {
    const color = pickColor(seed, y, x, base);
    return `calc(var(--px) * ${x - minX}) calc(var(--px) * ${y}) 0 0 ${color}`;
  });

  return {
    width: maxX - minX + 1,
    height: glyph.length,
    shadows: shadows.join(","),
  };
}

function PixelWord({ word, seed }: { word: string; seed: number }) {
  const base = Math.floor(noise(seed) * PALETTE.length);
  const letters = [...word]
    .map((char, index) => buildLetter(char, seed * 53 + index * 17, base))
    .filter((letter): letter is Letter => letter !== null);

  return (
    <span className="pixel-word" aria-hidden="true">
      {letters.map((letter, index) => (
        <span
          key={index}
          className="pixel-letter"
          style={{
            width: `calc(var(--px) * ${letter.width})`,
            height: `calc(var(--px) * ${letter.height})`,
            "--glyph": letter.shadows,
          } as React.CSSProperties}
        />
      ))}
    </span>
  );
}

const WORDS = ["BACA", "CATAT", "SIMPAN", "ULANGI", "HALAMAN DEMI HALAMAN"];

function Row({ copy }: { copy: number }) {
  return (
    <div className="pixel-row flex shrink-0 items-center">
      {WORDS.map((word, wordIndex) => {
        const seed = 7 + copy * 101 + wordIndex * 29;
        return (
          <span key={`${word}-${copy}`} className="flex items-center">
            {word.split(" ").map((part, partIndex) => (
              <span key={`${part}-${partIndex}`} className="flex items-center">
                {partIndex > 0 ? (
                  <span className="pixel-space" aria-hidden="true" />
                ) : null}
                <PixelWord word={part} seed={seed + partIndex * 11} />
              </span>
            ))}
            <span className="pixel-separator" aria-hidden="true" />
          </span>
        );
      })}
    </div>
  );
}

/**
 * A slow strip of the reading loop. The pixel mosaic is the gesture; motion is
 * decorative, so the motion toggle stops it. The words are announced once to
 * assistive technology and the visual copies are hidden from it.
 */
export function Marquee() {
  return (
    <div className="pixel-marquee overflow-hidden border-b border-line py-3">
      <p className="sr-only">
        Baca, catat, simpan, ulangi, halaman demi halaman.
      </p>
      <div
        className="animate-marquee flex w-max items-center"
        aria-hidden="true"
      >
        <Row copy={0} />
        <Row copy={1} />
      </div>
    </div>
  );
}
