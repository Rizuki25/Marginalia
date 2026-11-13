"use client";

import { useEffect, useRef } from "react";
import { cn } from "cn";

/**
 * Generative interactive pixel wave, the bottom bookend motif from DESIGN.md.
 *
 * Replaces the fixed-width static SVG drift with a full-bleed responsive canvas
 * using crisp stepped mosaic cells, shallow-water column wave propagation,
 * cursor wake lift, spray droplets, and click ripple bursts. Obeys both the
 * site-wide MotionToggle (`data-motion="off"`) and `prefers-reduced-motion`.
 */

interface WavePalette {
  ink: string;
  neon: string;
  gold: string;
  red: string;
  blue: string;
  navy: string;
}

const LIGHT_PALETTE: WavePalette = {
  ink: "#0a0a0a",
  neon: "#d8ff00",
  gold: "#f5c842",
  red: "#e0492a",
  blue: "#2d6cff",
  navy: "#1e2544",
};

const DARK_PALETTE: WavePalette = {
  ink: "#f2f2ef",
  neon: "#d8ff00",
  gold: "#f6d36d",
  red: "#ff6d4d",
  blue: "#5991ff",
  navy: "#8fa2e0",
};

type AccentKey = "neon" | "gold" | "red" | "blue" | "navy";

interface ColumnState {
  offset: number;
  velocity: number;
  flare: number;
}

interface Droplet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: AccentKey;
  life: number;
  maxLife: number;
}

interface ShockRing {
  col: number;
  row: number;
  radius: number;
  alpha: number;
  color: AccentKey;
}

function hash(seed: number): number {
  const v = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return v - Math.floor(v);
}

function pickAccent(seed: number): AccentKey {
  const r = hash(seed);
  if (r < 0.36) return "neon";
  if (r < 0.64) return "gold";
  if (r < 0.82) return "red";
  if (r < 0.94) return "blue";
  return "navy";
}

/**
 * Harmonic baseline height (in rows from the bottom) for a given world column
 * and time phase. Combines three prime-ish spatial frequencies so the crest
 * silhouette feels organic rather than mechanical.
 */
function sampleHarmonicHeight(
  worldCol: number,
  timeSec: number,
  maxWaveRows: number,
): number {
  const k1 = worldCol * 0.085 - timeSec * 1.35;
  const k2 = worldCol * 0.145 + timeSec * 0.82 + 1.4;
  const k3 = worldCol * 0.27 - timeSec * 1.95 + 2.7;

  const wave =
    0.52 +
    Math.sin(k1) * 0.24 +
    Math.sin(k2) * 0.15 +
    Math.cos(k3) * 0.09;

  return Math.max(2, Math.min(maxWaveRows, 2 + wave * (maxWaveRows - 2)));
}

export function PixelWave({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const isMotionOff = () =>
      reduceQuery.matches ||
      document.documentElement.dataset.motion === "off";

    const getPalette = (): WavePalette =>
      document.documentElement.classList.contains("dark")
        ? DARK_PALETTE
        : LIGHT_PALETTE;

    let width = 0;
    let height = 0;
    let step = 6;
    let cellSize = 5;
    let numCols = 0;
    let numRows = 0;
    let columns: ColumnState[] = [];
    const droplets: Droplet[] = [];
    const rings: ShockRing[] = [];

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      step = width >= 768 ? 6 : 5;
      cellSize = step - 1;
      numCols = Math.max(1, Math.ceil(width / step) + 1);
      numRows = Math.max(8, Math.floor(height / step));

      if (columns.length !== numCols) {
        const next: ColumnState[] = new Array(numCols);
        for (let i = 0; i < numCols; i += 1) {
          next[i] = columns[i] ?? { offset: 0, velocity: 0, flare: 0 };
        }
        columns = next;
      }

      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    let scrollCells = 0;
    let pointerX = -9999;
    let pointerY = -9999;
    let pointerVX = 0;
    let pointerVY = 0;
    let pointerActive = false;
    let sprayCooldown = 0;

    const spawnDroplets = (
      originX: number,
      originY: number,
      count: number,
      speedScale: number,
      biasVX = 0,
    ) => {
      for (let i = 0; i < count; i += 1) {
        if (droplets.length >= 64) droplets.shift();
        const seed = performance.now() * 0.13 + i * 37.7 + originX;
        const angle = -Math.PI * (0.18 + hash(seed) * 0.64);
        const speed = (65 + hash(seed + 19) * 115) * speedScale;
        const maxLife = 0.45 + hash(seed + 41) * 0.45;
        droplets.push({
          x: originX + (hash(seed + 7) - 0.5) * step * 2,
          y: originY,
          vx: Math.cos(angle) * speed + biasVX * 0.35,
          vy: Math.sin(angle) * speed - 28,
          color: pickAccent(Math.floor(seed)),
          life: maxLife,
          maxLife,
        });
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      if (isMotionOff()) return;
      const rect = container.getBoundingClientRect();
      const nx = event.clientX - rect.left;
      const ny = event.clientY - rect.top;

      if (pointerActive) {
        pointerVX = Math.max(-36, Math.min(36, nx - pointerX));
        pointerVY = Math.max(-36, Math.min(36, ny - pointerY));
      }

      pointerX = nx;
      pointerY = ny;
      pointerActive = true;

      const hoverCol = Math.floor(nx / step);
      const speed = Math.hypot(pointerVX, pointerVY);
      if (hoverCol >= 0 && hoverCol < columns.length) {
        const radiusCols = 5;
        for (let d = -radiusCols; d <= radiusCols; d += 1) {
          const idx = hoverCol + d;
          if (idx < 0 || idx >= columns.length) continue;
          const falloff = 1 - Math.abs(d) / (radiusCols + 1);
          const lift = Math.min(2.4, 0.38 + speed * 0.045) * falloff;
          columns[idx].velocity += lift * 8.5;
          columns[idx].flare = Math.min(1, columns[idx].flare + falloff * 0.45);
        }

        if (speed > 7 && sprayCooldown <= 0) {
          spawnDroplets(nx, ny, 2, 0.72, pointerVX * 8);
          sprayCooldown = 0.045;
        }
      }
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
      const clickX = event.clientX - rect.left;
      const clickY = event.clientY - rect.top;
      const centerCol = Math.floor(clickX / step);
      const centerRow = Math.floor(clickY / step);

      const impulseCols = 9;
      for (let d = -impulseCols; d <= impulseCols; d += 1) {
        const idx = centerCol + d;
        if (idx < 0 || idx >= columns.length) continue;
        const norm = Math.abs(d) / impulseCols;
        // Center dips briefly while the surrounding shoulders surge upward,
        // launching a clean bidirectional shallow-water wave.
        const profile = Math.cos(norm * Math.PI * 1.15);
        columns[idx].velocity += profile * 36;
        columns[idx].flare = 1;
      }

      rings.push({
        col: centerCol,
        row: centerRow,
        radius: 1.2,
        alpha: 1,
        color: pickAccent(centerCol * 13 + centerRow),
      });

      spawnDroplets(clickX, clickY, 14, 1.15, pointerVX * 4);
    };

    container.addEventListener("pointermove", onPointerMove, { passive: true });
    container.addEventListener("pointerleave", onPointerLeave);
    container.addEventListener("pointerdown", onPointerDown);

    let rafId = 0;
    let lastTime = performance.now();

    const drawFrame = (now: number, staticOnly: boolean) => {
      const dt = Math.min(0.04, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;
      if (width <= 0 || height <= 0 || numCols <= 0) return;

      const palette = getPalette();
      const timeSec = staticOnly ? 0 : now / 1000;
      const maxWaveRows = Math.max(5, numRows - 4);

      if (!staticOnly) {
        scrollCells = (scrollCells + dt * 5.2) % 10000;
        sprayCooldown = Math.max(0, sprayCooldown - dt);
      }

      // 1. Step 1D coupled wave equation across columns.
      if (!staticOnly) {
        const springK = 34;
        const damping = 4.6;
        const spread = 42;

        // Pull columns toward the hovered pointer height when cursor is inside.
        if (pointerActive) {
          const pCol = Math.floor(pointerX / step);
          const targetRowsFromBottom = Math.max(
            2,
            Math.min(numRows - 2, numRows - pointerY / step),
          );
          const pullRadius = 6;
          for (let d = -pullRadius; d <= pullRadius; d += 1) {
            const idx = pCol + d;
            if (idx < 0 || idx >= numCols) continue;
            const w = (1 - Math.abs(d) / (pullRadius + 1)) ** 2;
            const baseH = sampleHarmonicHeight(
              idx + scrollCells,
              timeSec,
              maxWaveRows,
            );
            const desiredOffset = Math.max(
              -3,
              Math.min(4.5, (targetRowsFromBottom - baseH) * 0.75),
            );
            columns[idx].velocity +=
              (desiredOffset - columns[idx].offset) * w * 28 * dt;
            columns[idx].flare = Math.max(columns[idx].flare, w * 0.85);
          }
        }

        for (let i = 0; i < numCols; i += 1) {
          const col = columns[i];
          const left = i > 0 ? columns[i - 1].offset : col.offset;
          const right = i < numCols - 1 ? columns[i + 1].offset : col.offset;
          const neighborForce = (left + right - 2 * col.offset) * spread;
          const restoreForce = -col.offset * springK;
          const accel = neighborForce + restoreForce - col.velocity * damping;
          col.velocity += accel * dt;
        }

        for (let i = 0; i < numCols; i += 1) {
          const col = columns[i];
          col.offset = Math.max(
            -3.5,
            Math.min(5.5, col.offset + col.velocity * dt),
          );
          col.flare = Math.max(0, col.flare - dt * 1.55);
        }
      } else {
        for (let i = 0; i < numCols; i += 1) {
          columns[i].offset = 0;
          columns[i].velocity = 0;
          columns[i].flare = 0;
        }
      }

      ctx.clearRect(0, 0, width, height);

      const wholeScroll = Math.floor(scrollCells);
      const shimmerTick = staticOnly ? 0 : Math.floor(now / 260);

      // 2. Render each wave column with stepped crest, dithered sub-crest,
      //    and solid ink body.
      for (let c = 0; c < numCols; c += 1) {
        const worldCol = c + wholeScroll;
        const baseFloat = sampleHarmonicHeight(
           c + scrollCells,
          timeSec,
          maxWaveRows,
        );
        const totalRows = Math.max(
          1,
          Math.min(
            numRows - 1,
            Math.round(baseFloat + columns[c].offset),
          ),
        );
        const topRow = numRows - totalRows;
        const flare = columns[c].flare;
        const px = c * step;

        for (let r = topRow; r < numRows; r += 1) {
          const depth = r - topRow;
          const py = r * step;
          let fill = palette.ink;

          if (depth === 0) {
            // Crest row: broken neon/gold/red/blue highlight that intensifies
            // when the cursor or a click ripple energises the column.
            const crestSignal =
              0.5 +
              0.5 * Math.sin(worldCol * 0.31 + timeSec * 1.4) +
              flare * 0.65;
            if (flare > 0.48) {
              fill = (worldCol + r) % 2 === 0 ? palette.neon : palette.gold;
            } else if (crestSignal > 0.76) {
              fill = palette.neon;
            } else if (crestSignal > 0.63) {
              fill = palette.gold;
            } else if (crestSignal > 0.54 && worldCol % 3 === 0) {
              fill = palette.red;
            } else if (flare > 0.22) {
              fill = palette.blue;
            }
          } else if (depth === 1) {
            // Sub-crest dither band: checkerboard transition between accent,
            // navy, and ink so the wave edge reads as woven pixel art.
            const isDitherCell = (worldCol + r) % 2 === 0;
            if (flare > 0.35 && isDitherCell) {
              fill = flare > 0.68 ? palette.blue : palette.navy;
            } else if (
              isDitherCell &&
              hash(worldCol * 17 + shimmerTick * 7) > 0.62
            ) {
              fill = palette.navy;
            }
          } else if (depth === 2 && flare > 0.45 && (worldCol + r) % 3 === 0) {
            fill = palette.navy;
          } else if (
            depth >= 2 &&
            hash(worldCol * 31 + r * 13 + shimmerTick * 3) > 0.94
          ) {
            fill = palette.navy;
          }

          ctx.fillStyle = fill;
          ctx.fillRect(px, py, cellSize, cellSize);
        }

        // Floating margin dust pixel above periodic columns, lifted by wave
        // energy and repelled slightly by the cursor.
        if (worldCol % 9 === 0) {
          const sparkSeed = worldCol * 23;
          const bob = staticOnly
            ? 0
            : Math.round(Math.sin(timeSec * 2.4 + sparkSeed) * 0.8);
          let sparkRow = topRow - 2 - (Math.abs(worldCol) % 2) + bob;

          if (pointerActive) {
            const dx = px - pointerX;
            const dy = sparkRow * step - pointerY;
            const dist = Math.hypot(dx, dy);
            if (dist < 64) {
              sparkRow -= Math.ceil((1 - dist / 64) * 2);
            }
          }

          if (sparkRow >= 0 && sparkRow < topRow) {
            const accent =
              flare > 0.3
                ? "neon"
                : pickAccent(Math.abs(worldCol) + shimmerTick);
            ctx.fillStyle = palette[accent];
            ctx.fillRect(px, sparkRow * step, cellSize, cellSize);
          }
        }
      }

      // 3. Render expanding stepped pixel shock rings from clicks.
      if (!staticOnly) {
        for (let idx = rings.length - 1; idx >= 0; idx -= 1) {
          const ring = rings[idx];
          ring.radius += dt * 16;
          ring.alpha -= dt * 1.65;
          if (ring.alpha <= 0) {
            rings.splice(idx, 1);
            continue;
          }

          const samples = Math.max(8, Math.round(ring.radius * 5));
          ctx.globalAlpha = Math.max(0, ring.alpha);
          ctx.fillStyle = palette[ring.color];
          for (let s = 0; s < samples; s += 1) {
            const angle = (s / samples) * Math.PI * 2;
            const gc = Math.round(ring.col + Math.cos(angle) * ring.radius);
            const gr = Math.round(ring.row + Math.sin(angle) * ring.radius);
            if (gc >= 0 && gc < numCols && gr >= 0 && gr < numRows) {
              ctx.fillRect(gc * step, gr * step, cellSize, cellSize);
            }
          }
          ctx.globalAlpha = 1;
        }
      }

      // 4. Update & render airborne pixel spray droplets (snapped to grid).
      if (!staticOnly) {
        const gravity = 290;
        for (let i = droplets.length - 1; i >= 0; i -= 1) {
          const d = droplets[i];
          d.vy += gravity * dt;
          d.x += d.vx * dt;
          d.y += d.vy * dt;
          d.life -= dt;

          const colIdx = Math.floor(d.x / step);
          const rowIdx = Math.floor(d.y / step);

          if (d.life <= 0 || colIdx < 0 || colIdx >= numCols) {
            droplets.splice(i, 1);
            continue;
          }

          // Re-enter the wave surface with a subtle secondary splash.
          const waveRows = Math.round(
            sampleHarmonicHeight(colIdx + scrollCells, timeSec, maxWaveRows) +
              columns[colIdx].offset,
          );
          const surfaceRow = numRows - waveRows;
          if (d.vy > 0 && rowIdx >= surfaceRow) {
            columns[colIdx].velocity -= 5.5;
            columns[colIdx].flare = Math.min(1, columns[colIdx].flare + 0.3);
            droplets.splice(i, 1);
            continue;
          }

          if (rowIdx >= 0 && rowIdx < numRows) {
            ctx.fillStyle = palette[d.color];
            ctx.fillRect(colIdx * step, rowIdx * step, cellSize, cellSize);
          }
        }
      }

      // 5. Draw a subtle stepped pixel cursor reticle when hovering the wave.
      if (!staticOnly && pointerActive) {
        const hc = Math.floor(pointerX / step);
        const hr = Math.floor(pointerY / step);
        const offsets: ReadonlyArray< readonly [number, number] > = [
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
        ];
        ctx.fillStyle = palette.neon;
        for (let i = 0; i < offsets.length; i += 1) {
          const [ox, oy] = offsets[i];
          const rc = hc + ox;
          const rr = hr + oy;
          if (rc >= 0 && rc < numCols && rr >= 0 && rr < numRows) {
            ctx.fillRect(rc * step, rr * step, cellSize, cellSize);
          }
        }
      }

      pointerVX *= 0.82;
      pointerVY *= 0.82;
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
      className={cn(
        "relative h-[84px] w-full overflow-hidden border-y border-line bg-paper select-none md:h-[108px]",
        className,
      )}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="block size-full"
      />
      <p className="sr-only">
        Dekorasi gelombang piksel interaktif, bukan data bacaan.
      </p>
    </div>
  );
}
