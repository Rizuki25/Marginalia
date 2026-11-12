"use client";

import { useEffect, useRef } from "react";

// DESIGN.md support colours. The trail is the one place they appear together,
// which is what makes it read as "colourful pixels" without recolouring the UI.
const COLORS = ["#d8ff00", "#f6d36d", "#1e2544", "#e0492a"];

const MAX_PARTICLES = 150;
const GRID = 2; // trail snaps to a 2px grid so it reads as pixels, not dots

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  size: number;
  color: string;
}

/**
 * Colourful pixel trail that follows the pointer.
 *
 * Deliberately opt-out: it does nothing on touch devices, under
 * `prefers-reduced-motion`, or while the motion toggle is off. The canvas is
 * `pointer-events: none`, so it never blocks a click.
 */
export function PixelCursor() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const motionOff = () =>
      document.documentElement.dataset.motion === "off";

    let width = 0;
    let height = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    const particles: Particle[] = [];
    let lastX = 0;
    let lastY = 0;
    let seeded = false;

    const spawn = (x: number, y: number, count: number) => {
      for (let i = 0; i < count; i += 1) {
        if (particles.length >= MAX_PARTICLES) return;
        particles.push({
          x: x + (Math.random() - 0.5) * 8,
          y: y + (Math.random() - 0.5) * 8,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5 + 0.12,
          age: 0,
          life: 24 + Math.random() * 22,
          size: 3 + Math.floor(Math.random() * 3) * 2,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
        });
      }
    };

    const onMove = (event: PointerEvent) => {
      if (motionOff()) return;

      const { clientX: x, clientY: y } = event;

      if (!seeded) {
        lastX = x;
        lastY = y;
        seeded = true;
        return;
      }

      // Stamp along the travelled distance so a fast flick stays continuous
      // instead of leaving a single dot per frame.
      const distance = Math.hypot(x - lastX, y - lastY);
      const count = Math.min(3, Math.max(1, Math.round(distance / 18)));
      spawn(x, y, count);

      lastX = x;
      lastY = y;
    };

    window.addEventListener("pointermove", onMove, { passive: true });

    let frame = 0;

    const draw = () => {
      frame = window.requestAnimationFrame(draw);
      ctx.clearRect(0, 0, width, height);

      if (motionOff()) {
        particles.length = 0;
        return;
      }

      for (let i = particles.length - 1; i >= 0; i -= 1) {
        const p = particles[i];
        p.age += 1;

        if (p.age >= p.life) {
          particles.splice(i, 1);
          continue;
        }

        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.015;

        ctx.globalAlpha = 1 - p.age / p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(
          Math.round(p.x / GRID) * GRID,
          Math.round(p.y / GRID) * GRID,
          p.size,
          p.size,
        );
      }

      ctx.globalAlpha = 1;
    };

    frame = window.requestAnimationFrame(draw);

    const onVisibility = () => {
      if (document.hidden) {
        window.cancelAnimationFrame(frame);
      } else {
        frame = window.requestAnimationFrame(draw);
      }
    };

    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-40 hidden md:block"
    />
  );
}
