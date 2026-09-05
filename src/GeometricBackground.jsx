import { useEffect, useRef } from "react";

const DOT_SPACING_DESKTOP = 34;
const DOT_SPACING_MOBILE = 46;
const POINTER_RADIUS = 155;
const PALETTE_STEPS = 12;
const FRAME_INTERVAL = 24;

// Normalized placements so the outlines sit in the same spots at any viewport size.
const shapeDefs = [
  { kind: "circle", x: 0.14, y: 0.26, size: 0.16, spin: 0.000055, depth: 26 },
  { kind: "square", x: 0.86, y: 0.66, size: 0.13, spin: -0.00009, depth: 42 },
  { kind: "triangle", x: 0.7, y: 0.12, size: 0.1, spin: 0.00013, depth: 18 }
];

function GeometricBackground({ theme }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const context = canvas.getContext("2d");
    if (!context) return undefined;

    const rootStyles = getComputedStyle(document.documentElement);
    const ink = rootStyles.getPropertyValue("--bg-ink-rgb").trim() || "13, 13, 13";
    const baseAlpha = Number(rootStyles.getPropertyValue("--bg-dot-alpha")) || 0.075;
    const glowAlpha = Number(rootStyles.getPropertyValue("--bg-glow-alpha")) || 0.28;
    const lineAlpha = Number(rootStyles.getPropertyValue("--bg-line-alpha")) || 0.05;
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    // Pre-built colour strings: avoids allocating a new rgba() string per dot per frame.
    const palette = Array.from({ length: PALETTE_STEPS + 1 }, (_, step) => {
      const alpha = baseAlpha + (glowAlpha - baseAlpha) * (step / PALETTE_STEPS);
      return `rgba(${ink}, ${alpha.toFixed(3)})`;
    });
    const lineColor = `rgba(${ink}, ${lineAlpha.toFixed(3)})`;

    const pointer = { x: -9999, y: -9999 };
    const eased = { x: -9999, y: -9999 };
    let dots = [];
    let width = 0;
    let height = 0;
    let rafId = 0;
    let lastFrame = 0;
    let resizeTimer = 0;

    const buildLattice = () => {
      const spacing = width < 720 ? DOT_SPACING_MOBILE : DOT_SPACING_DESKTOP;
      const next = [];
      for (let y = spacing / 2; y < height + spacing; y += spacing) {
        for (let x = spacing / 2; x < width + spacing; x += spacing) {
          next.push({ x, y });
        }
      }
      dots = next;
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildLattice();
    };

    const drawShapes = (time) => {
      const parallaxX = eased.x > -9000 ? (eased.x / width - 0.5) : 0;
      const parallaxY = eased.y > -9000 ? (eased.y / height - 0.5) : 0;

      context.strokeStyle = lineColor;
      context.lineWidth = 1;

      shapeDefs.forEach((shape) => {
        const radius = Math.min(width, height) * shape.size;
        const centerX = shape.x * width - parallaxX * shape.depth;
        const centerY = shape.y * height - parallaxY * shape.depth;

        context.save();
        context.translate(centerX, centerY);
        context.rotate(time * shape.spin);
        context.beginPath();

        if (shape.kind === "circle") {
          context.arc(0, 0, radius, 0, Math.PI * 2);
        } else if (shape.kind === "square") {
          context.rect(-radius, -radius, radius * 2, radius * 2);
        } else {
          const points = 3;
          for (let index = 0; index < points; index += 1) {
            const angle = (index / points) * Math.PI * 2 - Math.PI / 2;
            const pointX = Math.cos(angle) * radius;
            const pointY = Math.sin(angle) * radius;
            if (index === 0) context.moveTo(pointX, pointY);
            else context.lineTo(pointX, pointY);
          }
          context.closePath();
        }

        context.stroke();
        context.restore();
      });
    };

    const render = (time) => {
      context.clearRect(0, 0, width, height);
      drawShapes(time);

      const radius = POINTER_RADIUS;
      const radiusSquared = radius * radius;
      const active = eased.x > -9000;
      const highlights = [];

      // Pass one: every resting dot shares a single fill style.
      context.fillStyle = palette[0];
      for (let index = 0; index < dots.length; index += 1) {
        const dot = dots[index];
        if (active) {
          const dx = dot.x - eased.x;
          const dy = dot.y - eased.y;
          const distanceSquared = dx * dx + dy * dy;
          if (distanceSquared < radiusSquared) {
            highlights.push({ dot, dx, dy, distance: Math.sqrt(distanceSquared) });
            continue;
          }
        }
        context.fillRect(dot.x - 0.75, dot.y - 0.75, 1.5, 1.5);
      }

      // Pass two: only the handful of dots inside the cursor's reach.
      for (let index = 0; index < highlights.length; index += 1) {
        const { dot, dx, dy, distance } = highlights[index];
        const falloff = 1 - distance / radius;
        const weight = falloff * falloff;
        const size = 1.5 + weight * 3.4;
        const push = weight * 7;
        const safeDistance = distance || 1;
        const offsetX = (dx / safeDistance) * push;
        const offsetY = (dy / safeDistance) * push;

        context.fillStyle = palette[Math.round(weight * PALETTE_STEPS)];
        context.fillRect(
          dot.x + offsetX - size / 2,
          dot.y + offsetY - size / 2,
          size,
          size
        );
      }
    };

    const loop = (time) => {
      rafId = window.requestAnimationFrame(loop);
      if (time - lastFrame < FRAME_INTERVAL) return;
      lastFrame = time;

      if (eased.x < -9000 && pointer.x > -9000) {
        eased.x = pointer.x;
        eased.y = pointer.y;
      } else {
        eased.x += (pointer.x - eased.x) * 0.12;
        eased.y += (pointer.y - eased.y) * 0.12;
      }

      render(time);
    };

    const start = () => {
      if (rafId) return;
      lastFrame = 0;
      rafId = window.requestAnimationFrame(loop);
    };

    const stop = () => {
      if (!rafId) return;
      window.cancelAnimationFrame(rafId);
      rafId = 0;
    };

    const handlePointerMove = (event) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
    };

    const handlePointerLeave = () => {
      pointer.x = -9999;
      pointer.y = -9999;
      eased.x = -9999;
      eased.y = -9999;
    };

    const handleResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        resize();
        if (motionQuery.matches) render(0);
      }, 150);
    };

    const handleVisibility = () => {
      if (document.hidden) stop();
      else if (!motionQuery.matches) start();
    };

    resize();

    if (motionQuery.matches) {
      // Reduced motion: a single static lattice, no pointer reaction, no drift.
      render(0);
    } else {
      window.addEventListener("pointermove", handlePointerMove, { passive: true });
      document.addEventListener("pointerleave", handlePointerLeave);
      document.addEventListener("visibilitychange", handleVisibility);
      start();
    }

    window.addEventListener("resize", handleResize);

    return () => {
      stop();
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerleave", handlePointerLeave);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [theme]);

  return <canvas className="geo-canvas" ref={canvasRef} aria-hidden="true" />;
}

export default GeometricBackground;
