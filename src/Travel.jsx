import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { travelMeta, travelPhotos, travelRegions, travelRoute } from "./content/travel.js";

const GLOBE_RADIUS = 150;
const GLOBE_CENTER = 180;
const GLOBE_TILT = 20;
const FRAME_INTERVAL = 42;
const ROTATION_PER_SECOND = 2.4;

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function formatCoordinates([lat, lon]) {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lon >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(2)}°${ns} ${Math.abs(lon).toFixed(2)}°${ew}`;
}

// Orthographic projection: the globe is a technical drawing of a sphere, so a
// point is only drawn when it sits on the near hemisphere.
function project(lat, lon, rotation) {
  const phi = (lat * Math.PI) / 180;
  const lambda = ((lon - rotation) * Math.PI) / 180;
  const tilt = (GLOBE_TILT * Math.PI) / 180;
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);
  const cosLambda = Math.cos(lambda);

  const cosC = Math.sin(tilt) * sinPhi + Math.cos(tilt) * cosPhi * cosLambda;
  return {
    x: GLOBE_CENTER + GLOBE_RADIUS * cosPhi * Math.sin(lambda),
    y: GLOBE_CENTER - GLOBE_RADIUS * (Math.cos(tilt) * sinPhi - Math.sin(tilt) * cosPhi * cosLambda),
    visible: cosC > 0,
    depth: cosC
  };
}

// Sampled points become one or more path segments so the line disappears as it
// wraps around the far side instead of cutting straight across the disc.
function toPath(points) {
  let path = "";
  let drawing = false;
  points.forEach((point) => {
    if (!point.visible) {
      drawing = false;
      return;
    }
    path += `${drawing ? "L" : "M"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
    drawing = true;
  });
  return path;
}

function buildGraticule(rotation) {
  const meridians = [];
  for (let lon = -180; lon < 180; lon += 30) {
    const points = [];
    for (let lat = -90; lat <= 90; lat += 3) points.push(project(lat, lon, rotation));
    meridians.push(toPath(points));
  }

  const parallels = [];
  for (let lat = -60; lat <= 60; lat += 30) {
    const points = [];
    for (let lon = -180; lon <= 180; lon += 3) points.push(project(lat, lon, rotation));
    parallels.push({ path: toPath(points), equator: lat === 0 });
  }

  return { meridians, parallels };
}

// Great-circle interpolation, so a route arc bends the way it would on a globe.
function buildArc(from, to, rotation) {
  const [lat1, lon1] = from.map((value) => (value * Math.PI) / 180);
  const [lat2, lon2] = to.map((value) => (value * Math.PI) / 180);
  const delta = Math.acos(
    Math.min(1, Math.sin(lat1) * Math.sin(lat2) + Math.cos(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1))
  );
  if (!delta) return "";

  const points = [];
  const steps = 48;
  for (let step = 0; step <= steps; step += 1) {
    const f = step / steps;
    const a = Math.sin((1 - f) * delta) / Math.sin(delta);
    const b = Math.sin(f * delta) / Math.sin(delta);
    const x = a * Math.cos(lat1) * Math.cos(lon1) + b * Math.cos(lat2) * Math.cos(lon2);
    const y = a * Math.cos(lat1) * Math.sin(lon1) + b * Math.cos(lat2) * Math.sin(lon2);
    const z = a * Math.sin(lat1) + b * Math.sin(lat2);
    points.push(
      project((Math.atan2(z, Math.hypot(x, y)) * 180) / Math.PI, (Math.atan2(y, x) * 180) / Math.PI, rotation)
    );
  }
  return toPath(points);
}

// Idle drift, unless a photograph is hovered — then the globe eases around so
// the matching node comes into view on the near hemisphere.
function useIdleRotation(enabled, targetLon) {
  const [rotation, setRotation] = useState(20);

  useEffect(() => {
    const reduced = prefersReducedMotion();
    if (targetLon === null && (!enabled || reduced)) return undefined;

    let frame = 0;
    let last = 0;
    const step = (time) => {
      frame = window.requestAnimationFrame(step);
      if (time - last < FRAME_INTERVAL) return;
      const elapsed = last ? Math.min((time - last) / 1000, 0.25) : 0;
      last = time;

      setRotation((value) => {
        if (targetLon === null) return (value + ROTATION_PER_SECOND * elapsed) % 360;
        // Shortest way round the sphere, so it never spins the long way.
        const delta = ((targetLon - value + 540) % 360) - 180;
        if (Math.abs(delta) < 0.2) return targetLon;
        return value + delta * (reduced ? 1 : Math.min(1, elapsed * 4));
      });
    };

    frame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frame);
  }, [enabled, targetLon]);

  return rotation;
}

function Globe({ nodes, arcs, activeId, onHoverNode }) {
  const [inView, setInView] = useState(true);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const wrapRef = useRef(null);
  const targetLon = nodes.find((node) => node.id === activeId)?.coordinates[1] ?? null;
  const rotation = useIdleRotation(inView, targetLon);
  const { meridians, parallels } = useMemo(() => buildGraticule(rotation), [rotation]);

  useEffect(() => {
    const element = wrapRef.current;
    if (!element || !("IntersectionObserver" in window)) return undefined;
    const observer = new IntersectionObserver((entries) => setInView(entries[0]?.isIntersecting ?? true), {
      threshold: 0.05
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const handleMove = (event) => {
      const x = (event.clientX / window.innerWidth - 0.5) * 2;
      const y = (event.clientY / window.innerHeight - 0.5) * 2;
      setParallax({ x, y });
    };
    window.addEventListener("pointermove", handleMove, { passive: true });
    return () => window.removeEventListener("pointermove", handleMove);
  }, []);

  const projectedNodes = nodes
    .map((node) => ({ ...node, ...project(node.coordinates[0], node.coordinates[1], rotation) }))
    .filter((node) => node.visible);

  return (
    <div
      className="globe-wrap"
      ref={wrapRef}
      style={{ "--globe-shift-x": `${parallax.x * 6}px`, "--globe-shift-y": `${parallax.y * 5}px` }}
    >
      <svg className="globe" viewBox="0 0 360 360" role="img" aria-label="Rotating wireframe globe marking photographed locations">
        <circle className="globe-limb" cx={GLOBE_CENTER} cy={GLOBE_CENTER} r={GLOBE_RADIUS} />
        <g className="globe-graticule">
          {meridians.map((path, index) => (
            <path d={path} key={`meridian-${index}`} />
          ))}
          {parallels.map((parallel, index) => (
            <path d={parallel.path} key={`parallel-${index}`} className={parallel.equator ? "is-equator" : undefined} />
          ))}
        </g>
        <g className="globe-arcs">
          {arcs.map((arc) => (
            <path d={buildArc(arc.from, arc.to, rotation)} key={arc.id} />
          ))}
        </g>
        <g className="globe-nodes">
          {projectedNodes.map((node) => (
            <g
              key={node.id}
              className={`globe-node${activeId === node.id ? " is-active" : ""}`}
              style={{ opacity: 0.35 + node.depth * 0.65 }}
              onPointerEnter={() => onHoverNode?.(node.id)}
              onPointerLeave={() => onHoverNode?.(null)}
            >
              <circle cx={node.x} cy={node.y} r={activeId === node.id ? 5.5 : 3} />
              {activeId === node.id ? (
                <text x={node.x + 10} y={node.y + 3}>
                  {node.place?.toUpperCase()}
                </text>
              ) : null}
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}

function TravelHero({ nodes, arcs, activeId, onHoverNode, activeRegion, onSelectRegion }) {
  return (
    <header className="travel-hero">
      <div className="travel-hero-copy">
        <span className="travel-kicker">{travelMeta.kicker}</span>
        <h1>{travelMeta.title}</h1>
        <p>{travelMeta.intro}</p>
        <div className="travel-region-select" role="group" aria-label="Jump to region">
          {travelRegions.map((region) => (
            <a
              key={region.id}
              href={`#${region.id}`}
              className={`travel-region-link${activeRegion === region.id ? " is-active" : ""}`}
              onClick={() => onSelectRegion(region.id)}
            >
              {region.label}
            </a>
          ))}
        </div>
      </div>
      <Globe nodes={nodes} arcs={arcs} activeId={activeId} onHoverNode={onHoverNode} />
      <span className="travel-hero-rule" aria-hidden="true" />
    </header>
  );
}

function PhotoPlate({ photo, index, total, activeId, onHover, onOpen }) {
  return (
    <figure
      className={`travel-photo${activeId === photo.id ? " is-active" : ""}`}
      data-layout={photo.layout}
      onPointerEnter={() => onHover(photo.id)}
      onPointerLeave={() => onHover(null)}
    >
      <button
        type="button"
        className="travel-photo-button"
        onClick={() => onOpen(index)}
        onFocus={() => onHover(photo.id)}
        onBlur={() => onHover(null)}
        aria-label={`Open photograph ${index + 1} of ${total}: ${photo.place}, ${photo.country}`}
      >
        {photo.image ? (
          <img src={photo.image} alt="" loading="lazy" decoding="async" />
        ) : (
          <span className="travel-photo-placeholder" aria-hidden="true">
            <span>{photo.place}</span>
          </span>
        )}
        <span className="travel-photo-index" aria-hidden="true">
          {String(index + 1).padStart(2, "0")}
        </span>
      </button>
      <figcaption>
        <span className="travel-photo-place">
          {photo.place}, {photo.country}
        </span>
        <span className="travel-photo-date">{photo.date}</span>
        <span className="travel-photo-coords">{formatCoordinates(photo.coordinates)}</span>
      </figcaption>
    </figure>
  );
}

function RegionSection({ region, photos, activeId, onHover, onOpen, indexOffset, total }) {
  return (
    <section className={`travel-region travel-region-${region.density}`} id={region.id} aria-labelledby={`${region.id}-title`}>
      <div className="travel-region-head">
        <h2 id={`${region.id}-title`}>
          <span className="travel-region-index">{region.index}</span>
          <span className="travel-region-slash" aria-hidden="true">
            /
          </span>
          <span className="travel-region-name">{region.label}</span>
        </h2>
        <p>{region.note}</p>
      </div>
      <div className="travel-collage">
        {photos.map((photo, index) => (
          <PhotoPlate
            key={photo.id}
            photo={photo}
            index={indexOffset + index}
            total={total}
            activeId={activeId}
            onHover={onHover}
            onOpen={onOpen}
          />
        ))}
      </div>
    </section>
  );
}

function JourneyRule({ nodes }) {
  return (
    <section className="travel-journey" aria-label="Journey route">
      <span className="travel-journey-label">Route</span>
      <ol className="travel-journey-line">
        {nodes.map((node) => (
          <li key={node.id}>
            <span className="travel-journey-node" aria-hidden="true" />
            <span className="travel-journey-name">{node.label}</span>
            <span className="travel-journey-coords">{formatCoordinates(node.coordinates)}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

// Coarse India outline, traced as [lat, lon] so location nodes and the
// silhouette share one coordinate space.
const INDIA_OUTLINE = [
  [34.5, 76.5], [34.1, 74.2], [32.7, 74.5], [30.4, 74.6], [28.0, 72.4], [24.7, 71.0],
  [23.7, 68.2], [22.3, 69.8], [21.0, 72.7], [17.9, 73.3], [15.3, 73.9], [11.9, 75.2],
  [8.1, 77.5], [9.5, 79.1], [11.9, 79.8], [13.9, 80.3], [16.5, 82.3], [19.8, 85.9],
  [21.6, 87.9], [22.5, 89.0], [24.4, 88.1], [25.2, 89.9], [26.3, 90.0], [26.9, 92.5],
  [27.9, 95.4], [28.3, 94.0], [27.1, 92.1], [27.3, 89.0], [28.6, 84.0], [29.9, 81.0],
  [30.7, 78.5], [32.6, 78.9], [34.5, 78.9]
];

function IndiaPlate({ nodes, activeId, onHoverNode }) {
  const bounds = { minLat: 6.5, maxLat: 36.5, minLon: 66.5, maxLon: 97.5 };
  const toPoint = ([lat, lon]) => {
    const x = ((lon - bounds.minLon) / (bounds.maxLon - bounds.minLon)) * 200;
    const y = ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * 240;
    return [x, y];
  };
  const outline = `${INDIA_OUTLINE.map(toPoint)
    .map(([x, y], index) => `${index ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join("")}Z`;
  const layers = [10, 7, 4, 0];

  return (
    <div className="india-plate">
      <span className="india-plate-label" aria-hidden="true">
        Plate 02 — Topographic
      </span>
      <svg viewBox="-20 -10 260 290" className="india-plate-svg" role="img" aria-label="Contoured outline of India marking photographed locations">
        <g className="india-contours">
          {layers.map((offset) => (
            <path d={outline} key={offset} transform={`translate(${offset * 0.6} ${offset})`} />
          ))}
        </g>
        <g className="india-nodes">
          {nodes.map((node) => {
            const [x, y] = toPoint(node.coordinates);
            return (
              <g
                key={node.id}
                className={`india-node${activeId === node.id ? " is-active" : ""}`}
                onPointerEnter={() => onHoverNode?.(node.id)}
                onPointerLeave={() => onHoverNode?.(null)}
              >
                <circle cx={x} cy={y} r={activeId === node.id ? 4.5 : 2.4} />
                {activeId === node.id ? (
                  <text x={x + 8} y={y + 3}>
                    {node.place?.toUpperCase()}
                  </text>
                ) : null}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

function Lightbox({ photos, index, onClose, onStep }) {
  const dialogRef = useRef(null);
  const touchStart = useRef(null);
  const photo = photos[index];

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    dialogRef.current?.focus();
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    const handleKey = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") onStep(1);
      if (event.key === "ArrowLeft") onStep(-1);
      if (event.key === "Tab") {
        // Single-view dialog: keep the tab ring inside it.
        const focusable = dialogRef.current?.querySelectorAll("button");
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = overflow;
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [onClose, onStep]);

  return (
    <div
      className="travel-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={`${photo.place}, ${photo.country}`}
      ref={dialogRef}
      tabIndex={-1}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onTouchStart={(event) => {
        touchStart.current = event.changedTouches[0].clientX;
      }}
      onTouchEnd={(event) => {
        if (touchStart.current === null) return;
        const delta = event.changedTouches[0].clientX - touchStart.current;
        if (Math.abs(delta) > 60) onStep(delta < 0 ? 1 : -1);
        touchStart.current = null;
      }}
    >
      <div className="travel-lightbox-bar">
        <span className="travel-lightbox-count">
          {String(index + 1).padStart(2, "0")} / {String(photos.length).padStart(2, "0")}
        </span>
        <button type="button" className="travel-lightbox-close" onClick={onClose} aria-label="Close viewer">
          <i className="fa-solid fa-xmark" aria-hidden="true" />
        </button>
      </div>

      <figure className="travel-lightbox-figure">
        {photo.image ? (
          <img src={photo.image} alt={`${photo.place}, ${photo.country}`} />
        ) : (
          <span className="travel-lightbox-placeholder" aria-hidden="true">
            <span>{photo.place}</span>
          </span>
        )}
        <figcaption>
          <span className="travel-lightbox-place">
            {photo.place}, {photo.country}
          </span>
          <span className="travel-lightbox-meta">
            {photo.date} · {formatCoordinates(photo.coordinates)}
          </span>
          {photo.caption ? <span className="travel-lightbox-caption">{photo.caption}</span> : null}
        </figcaption>
      </figure>

      <div className="travel-lightbox-controls">
        <button type="button" onClick={() => onStep(-1)} aria-label="Previous photograph">
          <i className="fa-solid fa-arrow-left" aria-hidden="true" />
        </button>
        <button type="button" onClick={() => onStep(1)} aria-label="Next photograph">
          <i className="fa-solid fa-arrow-right" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export function TravelPage() {
  const [activeId, setActiveId] = useState(null);
  const [openIndex, setOpenIndex] = useState(null);
  const [activeRegion, setActiveRegion] = useState(travelRegions[0]?.id ?? "");

  const photosByRegion = useMemo(
    () =>
      travelRegions.map((region) => ({
        region,
        photos: travelPhotos.filter((photo) => photo.region === region.id)
      })),
    []
  );
  const orderedPhotos = useMemo(() => photosByRegion.flatMap((entry) => entry.photos), [photosByRegion]);
  const indiaNodes = useMemo(() => travelPhotos.filter((photo) => photo.region === "india"), []);
  const arcs = useMemo(
    () =>
      travelRoute.slice(0, -1).map((node, index) => ({
        id: `${node.id}-arc`,
        from: node.coordinates,
        to: travelRoute[index + 1].coordinates
      })),
    []
  );

  const step = useCallback(
    (direction) => {
      setOpenIndex((value) => {
        if (value === null) return value;
        return (value + direction + orderedPhotos.length) % orderedPhotos.length;
      });
    },
    [orderedPhotos.length]
  );
  const close = useCallback(() => setOpenIndex(null), []);

  let offset = 0;

  return (
    <div className="travel-page">
      <TravelHero
        nodes={travelPhotos}
        arcs={arcs}
        activeId={activeId}
        onHoverNode={setActiveId}
        activeRegion={activeRegion}
        onSelectRegion={setActiveRegion}
      />

      {photosByRegion.map((entry, entryIndex) => {
        const indexOffset = offset;
        offset += entry.photos.length;
        return (
          <div key={entry.region.id} className="travel-region-block">
            {entryIndex === 1 ? <JourneyRule nodes={travelRoute} /> : null}
            {entry.region.id === "india" ? (
              <IndiaPlate nodes={indiaNodes} activeId={activeId} onHoverNode={setActiveId} />
            ) : null}
            <RegionSection
              region={entry.region}
              photos={entry.photos}
              activeId={activeId}
              onHover={setActiveId}
              onOpen={setOpenIndex}
              indexOffset={indexOffset}
              total={orderedPhotos.length}
            />
          </div>
        );
      })}

      {openIndex !== null ? (
        <Lightbox photos={orderedPhotos} index={openIndex} onClose={close} onStep={step} />
      ) : null}
    </div>
  );
}
