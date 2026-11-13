"use client";

import { useEffect, useRef } from "react";
import {
  GLYPH_ROWS,
  PIXEL_FONT,
  SEPARATOR_DOT,
  type PixelGlyph,
} from "./marquee-font";

const PHRASE_WORDS = [
  "baca",
  "catat",
  "simpan",
  "ulangi",
  "halaman demi halaman",
];

const LETTER_GAP = 2;
const SPACE_GAP = 5;
const DOT_GAP = 6;
const SCROLL_SPEED_PX = 42;

interface Palette {
  gold: string;
  neon: string;
  red: string;
  blue: string;
  navy: string;
}

const LIGHT_PALETTE: Palette = {
  gold: "#f5c842",
  neon: "#d8ff00",
  red: "#e0492a",
  blue: "#2d6cff",
  navy: "#1e2544",
};

const DARK_PALETTE: Palette = {
  gold: "#f6d36d",
  neon: "#d8ff00",
  red: "#ff6d4d",
  blue: "#5991ff",
  navy: "#8fa2e0",
};

type ColorSlot = keyof Palette;

interface TrackCell {
  col: number;
  row: number;
  edge: boolean;
  slot: ColorSlot;
  altSlot: ColorSlot;
  seed: number;
  dx: number;
  dy: number;
  vx: number;
  vy: number;
  flare: number;
}

interface DotAnchor {
  col: number;
  row: number;
  hover: number;
}

interface ClickWave {
  x: number;
  y: number;
  radius: number;
  alpha: number;
}

function hash(seed: number): number {
  const v = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return v - Math.floor(v);
}

function pickSlot(seed: number, edge: boolean): ColorSlot {
  const r = hash(seed);
  if (edge) {
    if (r < 0.34) return "navy";
    if (r < 0.56) return "gold";
    if (r < 0.74) return "red";
    if (r < 0.9) return "blue";
    return "neon";
  }
  if (r < 0.42) return "gold";
  if (r < 0.64) return "neon";
  if (r < 0.82) return "red";
  if (r < 0.94) return "blue";
  return "navy";
}

function buildTrack(): {
  cells: TrackCell[];
  dots: DotAnchor[];
  totalCols: number;
} {
  const cells: TrackCell[] = [];
  const dots: DotAnchor[] = [];
  let cursorCol = 0;

  const pushGlyph = (glyph: PixelGlyph, seedBase: number, isDot = false) => {
    for (let i = 0; i < glyph.cells.length; i += 1) {
      const cell = glyph.cells[i];
      const seed = seedBase + i * 19 + cell.col * 7 + cell.row * 13;
      const slot: ColorSlot = isDot
        ? cell.edge
          ? "navy"
          : "neon"
        : pickSlot(seed, cell.edge);
      const altSlot = pickSlot(seed + 409, cell.edge);
      cells.push({
        col: cursorCol + cell.col,
        row: cell.row,
        edge: cell.edge,
        slot,
        altSlot,
        seed,
        dx: 0,
        dy: 0,
        vx: 0,
        vy: 0,
        flare: 0,
      });
    }
    cursorCol += glyph.width;
  };

  PHRASE_WORDS.forEach((phrase, phraseIndex) => {
    const parts = phrase.split(" ");
    parts.forEach((word, partIndex) => {
      if (partIndex > 0) cursorCol += SPACE_GAP;
      [...word].forEach((char, charIndex) => {
        const glyph = PIXEL_FONT[char];
        if (!glyph) return;
        if (charIndex > 0) cursorCol += LETTER_GAP;
        pushGlyph(
          glyph,
          phraseIndex * 997 + partIndex * 211 + charIndex * 53,
        );
      });
    });

    cursorCol += DOT_GAP;
    dots.push({
      col: cursorCol + SEPARATOR_DOT.width / 2,
      row: 8.5,
      hover: 0,
    });
    pushGlyph(SEPARATOR_DOT, phraseIndex * 503 + 77, true);
    cursorCol += DOT_GAP;
  });

  return { cells, dots, totalCols: cursorCol };
}

/**
 * Stepped pixel halo rings drawn around a hovered separator dot, matching the
 * interactive dot-burst motif from the Wild design reference.
 */
function drawDotHalo(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  hover: number,
  step: number,
  size: number,
  palette: Palette,
  time: number,
) {
  const rings: Array<{ radius: number; count: number; color: string }> = [
    { radius: 2.6 * step * hover, count: 10, color: palette.neon },
    { radius: 4.1 * step * hover, count: 16, color: palette.gold },
    { radius: 5.5 * step * hover, count: 22, color: palette.blue },
    { radius: 6.8 * step * hover, count: 24, color: palette.red },
  ];

  const spin = time * 0.0014;
  for (let rIdx = 0; rIdx < rings.length; rIdx += 1) {
    const ring = rings[rIdx];
    const dir = rIdx % 2 === 0 ? 1 : -1;
    for (let i = 0; i < ring.count; i += 1) {
      const angle = (i / ring.count) * Math.PI * 2 + spin * dir;
      const jitter = ((i + rIdx) % 3) === 0 ? 0.85 : 1;
      const px = cx + Math.cos(angle) * ring.radius * jitter;
      const py = cy + Math.sin(angle) * ring.radius * jitter;
      const snappedX = Math.round(px / step) * step;
      const snappedY = Math.round(py / step) * step;
      ctx.globalAlpha = Math.min(1, hover * (1 - rIdx * 0.14));
      ctx.fillStyle =
        (i + rIdx) % 5 === 0 ? palette.navy : ring.color;
      ctx.fillRect(snappedX, snappedY, size, size);
    }
  }
  ctx.globalAlpha = 1;
}

/**
 * High-density interactive pixel marquee.
 *
 * Renders multi-pixel letterforms with crisp mosaic gaps, ambient shimmer,
 * cursor wave displacement, click shockwaves, and expanding dot halos.
 * Obeys both the Motion toggle and `prefers-reduced-motion`.
 */
export function Marquee() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const track = buildTrack();
    const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const isMotionOff = () =>
      reduceQuery.matches ||
      document.documentElement.dataset.motion === "off";

    const getPalette = () =>
      document.documentElement.classList.contains("dark")
        ? DARK_PALETTE
        : LIGHT_PALETTE;

    let width = 0;
    let height = 0;
    let step = 6;
    let cellSize = 5;
    let topOffset = 16;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      step = width >= 768 ? 6 : 4;
      cellSize = step - 1;
      topOffset = Math.round((height - GLYPH_ROWS * step) / 2);

      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    let scrollX = 0;
    let pointerX = -9999;
    let pointerY = -9999;
    let pointerVX = 0;
    let pointerVY = 0;
    let pointerActive = false;
    const waves: ClickWave[] = [];

    const onPointerMove = (event: PointerEvent) => {
      if (isMotionOff()) return;
      const rect = container.getBoundingClientRect();
      const nx = event.clientX - rect.left;
      const ny = event.clientY - rect.top;
      if (pointerActive) {
        pointerVX = Math.max(-24, Math.min(24, nx - pointerX));
        pointerVY = Math.max(-24, Math.min(24, ny - pointerY));
      }
      pointerX = nx;
      pointerY = ny;
      pointerActive = true;
    };

    const onPointerLeave = () => {
      pointerActive = false;
      pointerX = -9999;
      pointerY = -9999;
      pointerVX = 0;
      pointerVY = 0;
    };

    const onPointerDown = (event: PointerEvent) => {
      if (isMotionOff()) return;
      const rect = container.getBoundingClientRect();
      waves.push({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        radius: 6,
        alpha: 1,
      });
    };

    container.addEventListener("pointermove", onPointerMove, { passive: true });
    container.addEventListener("pointerleave", onPointerLeave);
    container.addEventListener("pointerdown", onPointerDown);

    let rafId = 0;
    let lastTime = performance.now();

    const drawFrame = (now: number, staticOnly: boolean) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      const palette = getPalette();
      const trackPx = track.totalCols * step;
      if (trackPx <= 0 || width <= 0) return;

      if (!staticOnly) {
        scrollX = (scrollX + SCROLL_SPEED_PX * dt) % trackPx;
      }

      ctx.clearRect(0, 0, width, height);

      const copies = Math.ceil(width / trackPx) + 2;
      const shimmerTick = staticOnly ? 0 : Math.floor(now / 220);

      // Update expanding click shockwaves.
      for (let w = waves.length - 1; w >= 0; w -= 1) {
        const wave = waves[w];
        wave.radius += 260 * dt;
        wave.alpha -= 1.45 * dt;
        if (wave.alpha <= 0) waves.splice(w, 1);
      }

      // Draw interactive halos behind hovered separator dots.
      if (!staticOnly) {
        for (let d = 0; d < track.dots.length; d += 1) {
          const dot = track.dots[d];
          let hovered = false;
          let drawCx = 0;
          const drawCy = topOffset + dot.row * step;

          for (let c = 0; c < copies; c += 1) {
            const cx = c * trackPx - scrollX + dot.col * step;
            if (cx < -step * 10 || cx > width + step * 10) continue;
            if (pointerActive && Math.hypot(pointerX - cx, pointerY - drawCy) < 58) {
              hovered = true;
              drawCx = cx;
              break;
            }
          }

          const target = hovered ? 1 : 0;
          dot.hover += (target - dot.hover) * Math.min(1, dt * 11);

          if (dot.hover > 0.03) {
            if (!hovered) {
              for (let c = 0; c < copies; c += 1) {
                const cx = c * trackPx - scrollX + dot.col * step;
                if (cx >= -step * 10 && cx <= width + step * 10) {
                  drawDotHalo(
                    ctx,
                    cx,
                    drawCy,
                    dot.hover,
                    step,
                    cellSize,
                    palette,
                    now,
                  );
                }
              }
            } else {
              drawDotHalo(
                ctx,
                drawCx,
                drawCy,
                dot.hover,
                step,
                cellSize,
                palette,
                now,
              );
            }
          }
        }
      }

      // Update cell physics once per frame, then stamp every visible copy.
      const pointerRadius = 72;
      for (let i = 0; i < track.cells.length; i += 1) {
        const cell = track.cells[i];
        if (staticOnly) {
          cell.dx = 0;
          cell.dy = 0;
          cell.vx = 0;
          cell.vy = 0;
          cell.flare = 0;
          continue;
        }

        const baseY = topOffset + cell.row * step;
        let hitX = 0;
        let hitY = 0;
        let hitFlare = 0;

        if (pointerActive) {
          for (let c = 0; c < copies; c += 1) {
            const baseX = c * trackPx - scrollX + cell.col * step;
            if (baseX < -pointerRadius || baseX > width + pointerRadius) continue;

            const rx = baseX - pointerX;
            const ry = baseY - pointerY;
            const dist = Math.hypot(rx, ry);
            if (dist < pointerRadius && dist > 0.01) {
              const force = (1 - dist / pointerRadius) ** 2;
              hitX += (rx / dist) * force * 24 + pointerVX * force * 0.55;
              // Emphasise vertical pixel-stretch ripple as seen in the reference.
              hitY += (ry / dist) * force * 34 + pointerVY * force * 0.7;
              hitFlare = Math.max(hitFlare, force);
            }
          }
        }

        for (let w = 0; w < waves.length; w += 1) {
          const wave = waves[w];
          for (let c = 0; c < copies; c += 1) {
            const baseX = c * trackPx - scrollX + cell.col * step;
            const rx = baseX - wave.x;
            const ry = baseY - wave.y;
            const dist = Math.hypot(rx, ry);
            const band = Math.abs(dist - wave.radius);
            if (band < 28 && dist > 0.01) {
              const pulse = (1 - band / 28) * wave.alpha;
              hitX += (rx / dist) * pulse * 26;
              hitY += (ry / dist) * pulse * 38;
              hitFlare = Math.max(hitFlare, pulse);
            }
          }
        }

        // Spring back to home grid cell.
        const ax = (hitX - cell.dx) * 14 - cell.vx * 5.2;
        const ay = (hitY - cell.dy) * 14 - cell.vy * 5.2;
        cell.vx += ax * dt;
        cell.vy += ay * dt;
        cell.dx += cell.vx * dt;
        cell.dy += cell.vy * dt;
        cell.flare = Math.max(0, Math.min(1, cell.flare * 0.88 + hitFlare * 0.45));
      }

      // Snap displacement to a 2px pixel grid so stretched tiles stay sharp.
      const snap = 2;
      for (let c = 0; c < copies; c += 1) {
        const originX = c * trackPx - scrollX;
        if (originX > width + step * 4 || originX + trackPx < -step * 4) {
          continue;
        }

        for (let i = 0; i < track.cells.length; i += 1) {
          const cell = track.cells[i];
          const x =
            originX + cell.col * step + Math.round(cell.dx / snap) * snap;
          if (x < -step || x > width + step) continue;

          const y =
            topOffset + cell.row * step + Math.round(cell.dy / snap) * snap;

          let color = palette[cell.slot];
          if (!staticOnly) {
            if (cell.flare > 0.35) {
              color = cell.flare > 0.68 ? palette.neon : palette.blue;
            } else if (hash(cell.seed + shimmerTick * 31) > 0.93) {
              color = palette[cell.altSlot];
            }
          }

          ctx.fillStyle = color;
          ctx.fillRect(Math.round(x), Math.round(y), cellSize, cellSize);
        }
      }

      pointerVX *= 0.8;
      pointerVY *= 0.8;
    };

    const startLoop = () => {
      window.cancelAnimationFrame(rafId);
      lastTime = performance.now();

      if (isMotionOff()) {
        drawFrame(lastTime, true);
        return;
      }

      const tick = (now: number) => {
        drawFrame(now, false);
        rafId = window.requestAnimationFrame(tick);
      };
      rafId = window.requestAnimationFrame(tick);
    };

    startLoop();

    const observer = new MutationObserver(() => {
      startLoop();
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-motion"],
    });

    const onReduceChange = () => startLoop();
    reduceQuery.addEventListener("change", onReduceChange);

    const onVisibility = () => {
      if (document.hidden) {
        window.cancelAnimationFrame(rafId);
      } else {
        startLoop();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.cancelAnimationFrame(rafId);
      ro.disconnect();
      observer.disconnect();
      reduceQuery.removeEventListener("change", onReduceChange);
      document.removeEventListener("visibilitychange", onVisibility);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerleave", onPointerLeave);
      container.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative h-[88px] w-full overflow-hidden border-b border-line bg-paper select-none md:h-[128px]"
    >
      <p className="sr-only">
        Baca, catat, simpan, ulangi, halaman demi halaman.
      </p>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="block size-full"
      />
    </div>
  );
}
