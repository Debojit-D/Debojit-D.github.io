import { useEffect, useRef } from "react";
import { buildBackgroundScene } from "./backgroundGeometry.js";

const DOT_SPACING_DESKTOP = 34;
const DOT_SPACING_MOBILE = 46;
const POINTER_RADIUS = 155;
const PALETTE_STEPS = 12;
const FRAME_INTERVAL = 24;
const TABLET_BREAKPOINT = 1100;
const MOBILE_BREAKPOINT = 720;

// Stroke weights relative to the --bg-line-alpha token, so both themes stay
// inside the intended 5-9% (light) / 7-12% (dark) range for robot outlines and
// fade every supporting mark below that.
const STROKE_STYLES = [
  { bucket: "primary", alphaScale: 1.6, lineWidth: 1.15, dash: null },
  { bucket: "secondary", alphaScale: 1, lineWidth: 1, dash: null },
  { bucket: "annotation", alphaScale: 0.78, lineWidth: 1, dash: null },
  { bucket: "dashed", alphaScale: 0.68, lineWidth: 1, dash: [6, 7] }
];
const LABEL_ALPHA_SCALE = 0.72;
const LABEL_FONT = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';

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
    const strokeColors = STROKE_STYLES.map(
      (style) => `rgba(${ink}, ${(lineAlpha * style.alphaScale).toFixed(4)})`
    );
    const labelColor = `rgba(${ink}, ${(lineAlpha * LABEL_ALPHA_SCALE).toFixed(4)})`;

    const pointer = { x: -9999, y: -9999 };
    const eased = { x: -9999, y: -9999 };
    let dots = [];
    let scene = [];
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
      buildScene();
    };

    const buildScene = () => {
      const detail = width < MOBILE_BREAKPOINT ? 0 : width < TABLET_BREAKPOINT ? 1 : 2;
      scene = buildBackgroundScene(width, height, detail);
    };

    // The stencils are static geometry; only the parallax offset changes per
    // frame, so each layer is a prebuilt Path2D that is simply re-stroked.
    const drawScene = () => {
      const parallaxX = eased.x > -9000 ? eased.x / width - 0.5 : 0;
      const parallaxY = eased.y > -9000 ? eased.y / height - 0.5 : 0;

      context.lineJoin = "round";
      context.lineCap = "round";

      for (let index = 0; index < scene.length; index += 1) {
        const layer = scene[index];
        const offsetX = -parallaxX * layer.depth;
        const offsetY = -parallaxY * layer.depth;

        context.save();
        context.translate(offsetX, offsetY);

        for (let styleIndex = 0; styleIndex < STROKE_STYLES.length; styleIndex += 1) {
          const style = STROKE_STYLES[styleIndex];
          context.strokeStyle = strokeColors[styleIndex];
          context.lineWidth = style.lineWidth;
          if (style.dash) context.setLineDash(style.dash);
          context.stroke(layer[style.bucket]);
          if (style.dash) context.setLineDash([]);
        }

        if (layer.labels.length) {
          context.fillStyle = labelColor;
          context.textBaseline = "alphabetic";
          for (let labelIndex = 0; labelIndex < layer.labels.length; labelIndex += 1) {
            const item = layer.labels[labelIndex];
            context.font = `${item.size}px ${LABEL_FONT}`;
            context.fillText(item.text, item.x, item.y);
          }
        }

        context.restore();
      }
    };

    const render = () => {
      context.clearRect(0, 0, width, height);
      drawScene();

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

      render();
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
        if (motionQuery.matches) render();
      }, 150);
    };

    const handleVisibility = () => {
      if (document.hidden) stop();
      else if (!motionQuery.matches) start();
    };

    resize();

    if (motionQuery.matches) {
      // Reduced motion: a single static drawing, no pointer reaction, no drift.
      render();
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
