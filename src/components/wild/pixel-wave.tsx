/**
 * Generative pixel wave, the identity motif carried from DESIGN.md.
 *
 * It is drawn as columns of 10px cells: an ink body with a broken neon crest,
 * which keeps the accent colour as a highlight instead of a wash. Two identical
 * halves sit side by side so the CSS drift loops seamlessly.
 */

const CELL = 10;
const COLS = 72;
const ROWS = 8;
const HALF_W = COLS * CELL;
const H = ROWS * CELL;

/** Integer frequencies keep the pattern periodic, so the loop never jumps. */
function crestAt(x: number): number {
  const t = (x / COLS) * Math.PI * 2;
  const v =
    0.5 +
    0.5 *
      (Math.sin(t * 2) * 0.45 +
        Math.sin(t * 3 + 1.1) * 0.3 +
        Math.sin(t * 5 + 2.3) * 0.2);
  return Math.max(1, Math.min(ROWS, 1 + Math.round(v * (ROWS - 1))));
}

function highlightAt(x: number): number {
  const t = (x / COLS) * Math.PI * 2;
  return 0.5 + 0.5 * Math.sin(t * 7 + 0.6);
}

interface Cell {
  key: string;
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
}

function buildHalf(offset: number): Cell[] {
  const cells: Cell[] = [];

  for (let x = 0; x < COLS; x++) {
    const height = crestAt(x);
    const top = ROWS - height;
    const px = (x + offset) * CELL;

    // Body: one rect per column keeps the node count low while the 10px cell
    // size still gives the stair-stepped silhouette.
    const bodyRows = ROWS - top - 1;
    if (bodyRows > 0) {
      cells.push({
        key: `body-${offset}-${x}`,
        x: px,
        y: (top + 1) * CELL,
        w: CELL,
        h: bodyRows * CELL,
        fill: "var(--ink)",
      });
    }

    // Crest: neon on roughly a quarter of the columns, warm on a few, ink
    // everywhere else, so the highlight line looks broken rather than drawn.
    const h = highlightAt(x);
    const fill = h > 0.72 ? "var(--neon)" : h > 0.62 ? "var(--warm)" : "var(--ink)";

    cells.push({
      key: `crest-${offset}-${x}`,
      x: px,
      y: top * CELL,
      w: CELL,
      h: CELL,
      fill,
    });
  }

  // A few detached pixels above the wave, like dust in the margin.
  for (let i = 0; i < 6; i++) {
    const x = (i * 13 + 5 + offset) % COLS;
    const top = ROWS - crestAt(x);
    const y = (top - 2 - (i % 2)) * CELL;
    if (y < 0) continue;
    cells.push({
      key: `dust-${offset}-${i}`,
      x: x * CELL,
      y,
      w: CELL,
      h: CELL,
      fill: i % 2 === 0 ? "var(--red)" : "var(--warm)",
    });
  }

  return cells;
}

function Half({ offset }: { offset: number }) {
  const cells = buildHalf(offset);

  return (
    <svg
      width={HALF_W}
      height={H}
      viewBox={`0 0 ${HALF_W} ${H}`}
      aria-hidden="true"
      focusable="false"
      className="block h-full w-[720px] shrink-0"
    >
      {cells.map((cell) => (
        <rect
          key={cell.key}
          x={cell.x}
          y={cell.y}
          width={cell.w}
          height={cell.h}
          fill={cell.fill}
        />
      ))}
    </svg>
  );
}

export function PixelWave({ className }: { className?: string }) {
  return (
    <div
      className={
        "relative overflow-hidden border-y border-line " + (className ?? "")
      }
    >
      <div className="animate-pixel-drift flex h-16 w-max">
        <Half offset={0} />
        <Half offset={COLS} />
      </div>
      <p className="sr-only">
        Dekorasi gelombang piksel, bukan data bacaan.
      </p>
    </div>
  );
}
