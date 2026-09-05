// Technical-drawing stencils for the canvas backdrop.
//
// Every stencil is built once per layout into Path2D buckets and stroked later
// with a per-layer parallax offset, so the render loop never recomputes this
// geometry. Local coordinates are drawn in "stencil units" and mapped through a
// { x0, y0, k } transform, which is what lets a drawing be cropped by a viewport
// edge simply by anchoring it outside the frame.

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;

// ---------- transform + path primitives ----------

const mapX = (t, x) => t.x0 + x * t.k;
const mapY = (t, y) => t.y0 + y * t.k;

function line(path, t, x1, y1, x2, y2) {
  path.moveTo(mapX(t, x1), mapY(t, y1));
  path.lineTo(mapX(t, x2), mapY(t, y2));
}

function polyline(path, t, points, close = false) {
  points.forEach(([x, y], index) => {
    const px = mapX(t, x);
    const py = mapY(t, y);
    if (index === 0) path.moveTo(px, py);
    else path.lineTo(px, py);
  });
  if (close) path.closePath();
}

function circle(path, t, x, y, r) {
  const cx = mapX(t, x);
  const cy = mapY(t, y);
  const radius = Math.abs(r * t.k);
  if (radius < 0.2) return;
  path.moveTo(cx + radius, cy);
  path.arc(cx, cy, radius, 0, TAU);
}

function ellipse(path, t, x, y, rx, ry, rotation = 0) {
  const cx = mapX(t, x);
  const cy = mapY(t, y);
  const a = Math.abs(rx * t.k);
  const b = Math.abs(ry * t.k);
  if (a < 0.2 || b < 0.2) return;
  path.moveTo(cx + Math.cos(rotation) * a, cy + Math.sin(rotation) * a);
  path.ellipse(cx, cy, a, b, rotation, 0, TAU);
}

function arc(path, t, x, y, r, start, end) {
  const cx = mapX(t, x);
  const cy = mapY(t, y);
  const radius = Math.abs(r * t.k);
  if (radius < 0.2) return;
  path.moveTo(cx + Math.cos(start) * radius, cy + Math.sin(start) * radius);
  path.arc(cx, cy, radius, start, end);
}

// The outline of a link: the two outer tangents between a pair of joint circles,
// closed by the far-side arc of each. This is the contour that makes a chain of
// points read as a robot arm rather than a stick figure.
function capsule(path, t, x1, y1, r1, x2, y2, r2) {
  const ax = mapX(t, x1);
  const ay = mapY(t, y1);
  const bx = mapX(t, x2);
  const by = mapY(t, y2);
  const ra = Math.abs(r1 * t.k);
  const rb = Math.abs(r2 * t.k);
  const dx = bx - ax;
  const dy = by - ay;
  const distance = Math.hypot(dx, dy);
  if (distance < 0.5) return;

  const angle = Math.atan2(dy, dx);
  const ratio = Math.max(-1, Math.min(1, (ra - rb) / distance));
  const spread = Math.acos(ratio);

  path.moveTo(ax + Math.cos(angle + spread) * ra, ay + Math.sin(angle + spread) * ra);
  path.arc(ax, ay, ra, angle + spread, angle - spread, false);
  path.arc(bx, by, rb, angle - spread, angle + spread, false);
  path.closePath();
}

function roundedRect(path, t, cx, cy, halfWidth, halfHeight, radius, rotation = 0) {
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  const corner = (x, y) => [
    mapX(t, cx + x * cos - y * sin),
    mapY(t, cy + x * sin + y * cos)
  ];

  const r = Math.abs(Math.min(radius, halfWidth, halfHeight) * t.k);
  const corners = [
    corner(-halfWidth, -halfHeight),
    corner(halfWidth, -halfHeight),
    corner(halfWidth, halfHeight),
    corner(-halfWidth, halfHeight)
  ];
  const start = corner(0, -halfHeight);

  path.moveTo(start[0], start[1]);
  for (let index = 0; index < 4; index += 1) {
    const via = corners[(index + 1) % 4];
    const next = corners[(index + 2) % 4];
    path.arcTo(via[0], via[1], next[0], next[1], r);
  }
  path.closePath();
}

function arrow(path, t, x, y, angle, length, head = 7) {
  const tipX = x + Math.cos(angle) * length;
  const tipY = y + Math.sin(angle) * length;
  line(path, t, x, y, tipX, tipY);
  line(path, t, tipX, tipY, tipX - Math.cos(angle - 0.38) * head, tipY - Math.sin(angle - 0.38) * head);
  line(path, t, tipX, tipY, tipX - Math.cos(angle + 0.38) * head, tipY - Math.sin(angle + 0.38) * head);
}

// A rotation arrow: the arc plus a head on its tangent, for q / theta callouts.
function curvedArrow(path, t, x, y, r, start, end, head = 6) {
  arc(path, t, x, y, r, start, end);
  const tipX = x + Math.cos(end) * r;
  const tipY = y + Math.sin(end) * r;
  const tangent = end + (end > start ? Math.PI / 2 : -Math.PI / 2);
  line(path, t, tipX, tipY, tipX - Math.cos(tangent - 0.42) * head, tipY - Math.sin(tangent - 0.42) * head);
  line(path, t, tipX, tipY, tipX - Math.cos(tangent + 0.42) * head, tipY - Math.sin(tangent + 0.42) * head);
}

// ---------- shared mechanical details ----------

// Outer race, inner race, and centre bore: reads as a joint rather than a dot.
function jointRing(layer, t, x, y, r) {
  circle(layer.primary, t, x, y, r);
  circle(layer.secondary, t, x, y, r * 0.62);
  circle(layer.secondary, t, x, y, r * 0.17);
}

// A seam running along a link, offset from its axis the way a moulded shell parts.
function seamLine(layer, t, x1, y1, r1, x2, y2, r2, offsetRatio = 0.42) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const nx = Math.cos(angle + Math.PI / 2);
  const ny = Math.sin(angle + Math.PI / 2);
  const offset = Math.min(r1, r2) * offsetRatio;
  const startX = x1 + (x2 - x1) * 0.22 + nx * offset;
  const startY = y1 + (y2 - y1) * 0.22 + ny * offset;
  const endX = x1 + (x2 - x1) * 0.78 + nx * offset;
  const endY = y1 + (y2 - y1) * 0.78 + ny * offset;
  line(layer.secondary, t, startX, startY, endX, endY);
}

// A serial chain: link contours, joint rings, and seams from a list of joints.
function drawChain(layer, t, joints, { seams = true } = {}) {
  for (let index = 0; index < joints.length - 1; index += 1) {
    const a = joints[index];
    const b = joints[index + 1];
    capsule(layer.primary, t, a.x, a.y, a.r, b.x, b.y, b.r);
    if (seams) seamLine(layer, t, a.x, a.y, a.r, b.x, b.y, b.r);
  }
  joints.forEach((joint) => jointRing(layer, t, joint.x, joint.y, joint.r));
}

// Mounting face at the end of a wrist: plate line plus bolt circle.
function drawFlange(layer, t, x, y, angle, radius) {
  const nx = Math.cos(angle + Math.PI / 2);
  const ny = Math.sin(angle + Math.PI / 2);
  line(layer.primary, t, x + nx * radius, y + ny * radius, x - nx * radius, y - ny * radius);
  circle(layer.secondary, t, x, y, radius * 0.55);
  for (let index = 0; index < 4; index += 1) {
    const boltAngle = angle + index * (Math.PI / 2) + Math.PI / 4;
    circle(layer.secondary, t, x + Math.cos(boltAngle) * radius * 0.72, y + Math.sin(boltAngle) * radius * 0.72, radius * 0.12);
  }
}

// Parallel two-finger gripper, drawn open by `spread`.
function drawParallelGripper(layer, t, x, y, angle, size, spread = 1) {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const nx = Math.cos(angle + Math.PI / 2);
  const ny = Math.sin(angle + Math.PI / 2);

  // Body between flange and fingers.
  const bodyX = x + dx * size * 0.42;
  const bodyY = y + dy * size * 0.42;
  roundedRect(layer.primary, t, bodyX, bodyY, size * 0.42, size * 0.34, size * 0.12, angle);
  line(layer.secondary, t, bodyX - nx * size * 0.34, bodyY - ny * size * 0.34, bodyX + nx * size * 0.34, bodyY + ny * size * 0.34);

  const jawBase = size * 0.84;
  const offset = size * 0.3 * spread;
  [1, -1].forEach((side) => {
    const rootX = x + dx * jawBase + nx * offset * side;
    const rootY = y + dy * jawBase + ny * offset * side;
    const tipX = rootX + dx * size * 0.62;
    const tipY = rootY + dy * size * 0.62;
    capsule(layer.primary, t, rootX, rootY, size * 0.15, tipX, tipY, size * 0.11);
    // Fingertip pad.
    line(layer.secondary, t, tipX - nx * size * 0.1 * side, tipY - ny * size * 0.1 * side, rootX - nx * size * 0.1 * side, rootY - ny * size * 0.1 * side);
  });
}

// Callouts are placed in stencil-local coordinates so they stay beside the
// feature they name, but sized from t.f (the global scale) so a small stencil
// does not end up with unreadably small text.
function labelAt(layer, t, text, x, y, size = 12) {
  layer.labels.push({
    text,
    x: mapX(t, x),
    y: mapY(t, y),
    size: Math.round(size * (t.f ?? t.k))
  });
}

// ---------- annotations ----------

export function drawCoordinateFrame(layer, t, x, y, size, rotation = 0) {
  // Isometric triad: z up, x to the lower left, y to the lower right.
  const axes = [-90 * DEG, 150 * DEG, 30 * DEG];
  axes.forEach((axis, index) => {
    const length = index === 0 ? size : size * 0.82;
    arrow(layer.annotation, t, x, y, axis + rotation, length, size * 0.2);
  });
  circle(layer.annotation, t, x, y, size * 0.07);
}

export function drawScrewAxis(layer, t, x, y, angle, length) {
  const half = length / 2;
  line(layer.dashed, t, x - Math.cos(angle) * half, y - Math.sin(angle) * half, x + Math.cos(angle) * half, y + Math.sin(angle) * half);
  arrow(layer.annotation, t, x + Math.cos(angle) * half * 0.72, y + Math.sin(angle) * half * 0.72, angle, half * 0.28, length * 0.05);
  // Rotation about the axis.
  curvedArrow(layer.annotation, t, x, y, length * 0.17, angle - 2.5, angle + 0.6, length * 0.05);
}

export function drawContactAnnotation(layer, t, x, y, normalAngle, size) {
  circle(layer.annotation, t, x, y, size * 0.09);
  arrow(layer.annotation, t, x, y, normalAngle, size, size * 0.22);
  // Friction cone.
  const cone = 20 * DEG;
  line(layer.dashed, t, x, y, x + Math.cos(normalAngle - cone) * size * 0.82, y + Math.sin(normalAngle - cone) * size * 0.82);
  line(layer.dashed, t, x, y, x + Math.cos(normalAngle + cone) * size * 0.82, y + Math.sin(normalAngle + cone) * size * 0.82);
  // Local tangent at the contact.
  const tangent = normalAngle + Math.PI / 2;
  line(layer.secondary, t, x - Math.cos(tangent) * size * 0.34, y - Math.sin(tangent) * size * 0.34, x + Math.cos(tangent) * size * 0.34, y + Math.sin(tangent) * size * 0.34);
}

// ---------- stencils ----------

// 7-DoF research arm in the Franka idiom: tapering links, prominent joint
// housings, two-finger hand. Anchored at its base so it crops off a corner.
export function drawFrankaStencil(layer, t, { annotate = true } = {}) {
  const joints = [
    { x: 0, y: 0, r: 62 },
    { x: -24, y: 116, r: 54 },
    { x: -186, y: 232, r: 46 },
    { x: -140, y: 402, r: 39 },
    { x: -282, y: 470, r: 32 },
    { x: -352, y: 552, r: 26 }
  ];

  // Base mount, mostly cropped away by the viewport edge.
  ellipse(layer.primary, t, 26, -62, 86, 30, -12 * DEG);
  line(layer.secondary, t, -58, -50, 108, -80);
  drawChain(layer, t, joints);

  const wrist = joints[joints.length - 2];
  const tip = joints[joints.length - 1];
  const toolAngle = Math.atan2(tip.y - wrist.y, tip.x - wrist.x);
  drawFlange(layer, t, tip.x, tip.y, toolAngle, 26);
  drawParallelGripper(layer, t, tip.x, tip.y, toolAngle, 62, 1);

  if (!annotate) return;

  // Tool frame at the hand, and the arc the tool would sweep.
  const toolX = tip.x + Math.cos(toolAngle) * 132;
  const toolY = tip.y + Math.sin(toolAngle) * 132;
  drawCoordinateFrame(layer, t, toolX, toolY, 52, 0);
  arc(layer.dashed, t, joints[2].x, joints[2].y, 372, 58 * DEG, 128 * DEG);
  // Elbow joint angle.
  curvedArrow(layer.annotation, t, joints[2].x, joints[2].y, 72, -40 * DEG, 40 * DEG, 9);
  drawScrewAxis(layer, t, joints[1].x, joints[1].y, 34 * DEG, 250);

  labelAt(layer, t, "J(q)", -318, 178, 12);
  labelAt(layer, t, "q₄", -368, 392, 10.5);
}

// Tube-and-cylinder arm in the Universal Robots idiom: constant-diameter links
// with a transverse cylinder at every joint, and a three-cylinder wrist cluster.
export function drawURStencil(layer, t, { annotate = true } = {}) {
  const base = { x: 0, y: 0 };
  const shoulder = { x: 0, y: -104 };
  const elbow = { x: 210, y: -296 };
  const wrist1 = { x: 412, y: -412 };
  const wrist2 = { x: 470, y: -474 };
  const wrist3 = { x: 534, y: -512 };

  // Base pedestal.
  ellipse(layer.primary, t, base.x, base.y, 74, 26);
  line(layer.primary, t, -74, 0, -74, 34);
  line(layer.primary, t, 74, 0, 74, 34);
  ellipse(layer.secondary, t, base.x, base.y + 34, 74, 26);
  circle(layer.secondary, t, base.x, base.y, 30);

  // Links as constant-radius tubes.
  capsule(layer.primary, t, base.x, base.y - 20, 38, shoulder.x, shoulder.y, 38);
  capsule(layer.primary, t, shoulder.x, shoulder.y, 36, elbow.x, elbow.y, 34);
  capsule(layer.primary, t, elbow.x, elbow.y, 31, wrist1.x, wrist1.y, 28);
  seamLine(layer, t, shoulder.x, shoulder.y, 36, elbow.x, elbow.y, 34, 0.46);
  seamLine(layer, t, elbow.x, elbow.y, 31, wrist1.x, wrist1.y, 28, 0.46);

  const upperAngle = Math.atan2(elbow.y - shoulder.y, elbow.x - shoulder.x);
  const foreAngle = Math.atan2(wrist1.y - elbow.y, wrist1.x - elbow.x);

  // Transverse joint cylinders — the detail that makes the arm read as a UR.
  drawCylinderJoint(layer, t, shoulder.x, shoulder.y, upperAngle + Math.PI / 2, 46, 58);
  drawCylinderJoint(layer, t, elbow.x, elbow.y, foreAngle + Math.PI / 2, 40, 50);
  drawCylinderJoint(layer, t, wrist1.x, wrist1.y, foreAngle, 30, 36);
  drawCylinderJoint(layer, t, wrist2.x, wrist2.y, foreAngle + Math.PI / 2, 27, 32);

  capsule(layer.primary, t, wrist1.x, wrist1.y, 26, wrist2.x, wrist2.y, 25);
  capsule(layer.primary, t, wrist2.x, wrist2.y, 24, wrist3.x, wrist3.y, 22);

  const toolAngle = Math.atan2(wrist3.y - wrist2.y, wrist3.x - wrist2.x);
  drawFlange(layer, t, wrist3.x, wrist3.y, toolAngle, 24);
  // Parallel-jaw gripper, matching the Franka hand's idiom.
  drawParallelGripper(layer, t, wrist3.x, wrist3.y, toolAngle, 56, 1);

  if (!annotate) return;

  // Tool frame at the gripper, mirroring the Franka's.
  const toolX = wrist3.x + Math.cos(toolAngle) * 118;
  const toolY = wrist3.y + Math.sin(toolAngle) * 118;
  drawCoordinateFrame(layer, t, toolX, toolY, 46, 0);
  drawCoordinateFrame(layer, t, base.x + 132, base.y - 40, 54, 0);
  drawScrewAxis(layer, t, base.x, base.y - 150, -90 * DEG, 210);
  curvedArrow(layer.annotation, t, elbow.x, elbow.y, 66, 150 * DEG, 244 * DEG, 9);
  arc(layer.dashed, t, elbow.x, elbow.y, 250, -84 * DEG, -14 * DEG);

  labelAt(layer, t, "θ₁", base.x + 122, base.y - 118, 10.5);
  labelAt(layer, t, "ω", base.x + 146, base.y - 250, 10.5);
}

// A joint housing whose axis lies across the link, drawn as a rounded body with
// a face ellipse so it reads as a cylinder rather than a slab.
function drawCylinderJoint(layer, t, x, y, axisAngle, radius, length) {
  roundedRect(layer.primary, t, x, y, length / 2, radius, radius * 0.55, axisAngle);
  const faceX = x + Math.cos(axisAngle) * (length / 2);
  const faceY = y + Math.sin(axisAngle) * (length / 2);
  ellipse(layer.secondary, t, faceX, faceY, radius * 0.86, radius * 0.28, axisAngle + Math.PI / 2);
  circle(layer.secondary, t, x, y, radius * 0.3);
}

// Two arms facing each other across a shared object: the handover geometry, with
// contact normals on both jaws and a grasp frame on the object.
export function drawBimanualSetup(layer, t, { annotate = true } = {}) {
  // Work surface.
  line(layer.primary, t, -560, 186, 560, 186);
  line(layer.secondary, t, -520, 204, 520, 204);

  const buildArm = (sign) => {
    const flip = (x) => x * sign;
    const joints = [
      { x: flip(360), y: 150, r: 34 },
      { x: flip(330), y: 22, r: 29 },
      { x: flip(212), y: -66, r: 25 },
      { x: flip(120), y: -26, r: 20 }
    ];
    drawChain(layer, t, joints);
    // Pedestal under the base joint.
    roundedRect(layer.primary, t, flip(360), 170, 46, 22, 8, 0);

    const wrist = joints[2];
    const tip = joints[3];
    const angle = Math.atan2(tip.y - wrist.y, tip.x - wrist.x);
    drawFlange(layer, t, tip.x, tip.y, angle, 20);
    drawParallelGripper(layer, t, tip.x, tip.y, angle, 46, 0.86);
  };

  buildArm(-1);
  buildArm(1);

  // Object held between the two hands.
  roundedRect(layer.primary, t, 0, 0, 46, 34, 10, 0);
  line(layer.secondary, t, -46, -10, 46, -10);
  line(layer.secondary, t, -46, 12, 46, 12);

  if (!annotate) return;

  drawCoordinateFrame(layer, t, 0, 0, 40, 0);
  // Opposed contact normals where each jaw meets the object.
  drawContactAnnotation(layer, t, -46, -14, 0, 24);
  drawContactAnnotation(layer, t, 46, 14, Math.PI, 24);
  // Handover trajectory arcing between the two end effectors.
  arc(layer.dashed, t, 0, 40, 118, 198 * DEG, 342 * DEG);
  labelAt(layer, t, "T ∈ SE(3)", -62, -136, 12);
}

// Multi-fingered hand in a slightly open grasp, drawn as a skeletal joint chain.
export function drawDexterousHand(layer, t, { annotate = true } = {}) {
  // Fingers: root on the palm edge, a base direction, then per-phalanx curl.
  const fingers = [
    { x: -52, y: -54, angle: -104, lengths: [58, 42, 28], curls: [0, -20, -24], radii: [15, 12.5, 10, 8] },
    { x: -14, y: -68, angle: -95, lengths: [64, 46, 30], curls: [0, -18, -22], radii: [16, 13, 10.5, 8.5] },
    { x: 24, y: -64, angle: -86, lengths: [58, 42, 28], curls: [0, -20, -25], radii: [15, 12, 10, 8] },
    { x: 58, y: -48, angle: -74, lengths: [44, 32, 22], curls: [0, -22, -26], radii: [13, 10.5, 8.5, 7] },
    { x: -66, y: 10, angle: -172, lengths: [50, 38, 26], curls: [0, 26, 24], radii: [17, 13.5, 11, 9] }
  ];

  const fingertips = [];

  fingers.forEach((finger) => {
    let x = finger.x;
    let y = finger.y;
    let angle = finger.angle * DEG;

    for (let index = 0; index < finger.lengths.length; index += 1) {
      angle += finger.curls[index] * DEG;
      const nextX = x + Math.cos(angle) * finger.lengths[index];
      const nextY = y + Math.sin(angle) * finger.lengths[index];
      capsule(layer.primary, t, x, y, finger.radii[index], nextX, nextY, finger.radii[index + 1]);
      circle(layer.secondary, t, x, y, finger.radii[index] * 0.5);
      x = nextX;
      y = nextY;
    }

    circle(layer.secondary, t, x, y, finger.radii[finger.radii.length - 1] * 0.45);
    fingertips.push({ x, y, angle });
  });

  // Palm and wrist stub, the stub running off toward the viewport edge.
  polyline(
    layer.primary,
    t,
    [
      [-74, 6],
      [-64, -52],
      [-16, -76],
      [34, -70],
      [72, -46],
      [84, 4],
      [58, 48],
      [-38, 50]
    ],
    true
  );
  line(layer.secondary, t, -52, 18, 66, 12);
  // Wrist stub, running off toward the viewport edge.
  capsule(layer.primary, t, 10, 50, 50, 84, 158, 44);
  circle(layer.secondary, t, 10, 50, 24);

  if (!annotate) return;

  // Opposed contacts: index fingertip against the thumb.
  const index = fingertips[0];
  const thumb = fingertips[4];
  drawContactAnnotation(layer, t, index.x, index.y + 8, 96 * DEG, 38);
  drawContactAnnotation(layer, t, thumb.x + 6, thumb.y, -12 * DEG, 38);
  drawCoordinateFrame(layer, t, 8, -8, 42, 0);
  // Closing trajectory of the fingertips.
  arc(layer.dashed, t, 4, -18, 152, -142 * DEG, -34 * DEG);
  labelAt(layer, t, "ξ = [v, ω] ∈ se(3)", -142, 108, 12);
}

// A fingertip pressing into a surface: the tactile/contact-rich detail.
export function drawTactileDetail(layer, t) {
  // Surface being touched.
  line(layer.primary, t, -150, 62, 150, 62);
  for (let index = -6; index <= 6; index += 1) {
    line(layer.secondary, t, index * 22, 62, index * 22 - 12, 82);
  }

  // Fingertip, flattened slightly where it meets the surface.
  capsule(layer.primary, t, -6, -74, 26, 0, 40, 32);
  circle(layer.secondary, t, -6, -74, 13);
  line(layer.secondary, t, -30, 46, 30, 46);

  // Pressure distribution across the contact patch.
  [-22, -11, 0, 11, 22].forEach((offset, index) => {
    const magnitude = 26 - Math.abs(index - 2) * 6;
    arrow(layer.annotation, t, offset, 62, -90 * DEG, magnitude, 6);
  });
  drawContactAnnotation(layer, t, 0, 62, -90 * DEG, 54);
}

// ---------- scene composition ----------

function createLayer(depth) {
  return {
    depth,
    primary: new Path2D(),
    secondary: new Path2D(),
    annotation: new Path2D(),
    dashed: new Path2D(),
    labels: []
  };
}

/**
 * Builds the parallax layers for the current viewport.
 *
 * detail 2 — desktop: every stencil and annotation.
 * detail 1 — tablet: the two arms and the hand, reduced, few annotations.
 * detail 0 — mobile: one cropped hand silhouette, no annotations.
 */
export function buildBackgroundScene(width, height, detail) {
  const layers = [];
  const unit = Math.min(width, height) / 900;
  const scale = Math.min(Math.max(unit, 0.62), 1.24);

  if (detail === 0) {
    // Mobile: one cropped hand silhouette beside the dots, no annotations.
    const hand = createLayer(12);
    drawDexterousHand(
      hand,
      { x0: width * 1.0, y0: height * 0.88, k: scale * 0.86, f: scale },
      { annotate: false }
    );
    layers.push(hand);
    return layers;
  }

  const reduced = detail === 1;

  // Franka, entering from the upper right.
  const franka = createLayer(10);
  drawFrankaStencil(
    franka,
    { x0: width * 1.08, y0: -height * (reduced ? 0.16 : 0.1), k: scale * (reduced ? 0.74 : 0.92), f: scale },
    { annotate: !reduced }
  );
  layers.push(franka);

  // UR, entering from the lower left.
  const ur = createLayer(17);
  drawURStencil(
    ur,
    { x0: -width * 0.05, y0: height * 1.14, k: scale * (reduced ? 0.68 : 0.82), f: scale },
    { annotate: !reduced }
  );
  layers.push(ur);

  // Dexterous hand, cropped by the right edge near the bottom.
  const hand = createLayer(13);
  drawDexterousHand(
    hand,
    { x0: width * (reduced ? 1.04 : 1.025), y0: height * (reduced ? 0.94 : 0.92), k: scale * (reduced ? 0.84 : 1.05), f: scale },
    { annotate: !reduced }
  );
  layers.push(hand);

  if (reduced) return layers;

  // Bimanual handover tucked into the top-left corner, in the gap between the
  // header and the sidebar photo — small enough to stay clear of the "About"
  // heading and its text column.
  const bimanual = createLayer(8);
  drawBimanualSetup(bimanual, { x0: width * 0.1, y0: height * 0.11, k: scale * 0.32, f: scale * 0.6 });
  layers.push(bimanual);

  // Tactile contact detail, cropped by the bottom edge.
  const tactile = createLayer(12);
  drawTactileDetail(tactile, { x0: width * 0.71, y0: height * 0.965, k: scale * 0.6, f: scale });
  layers.push(tactile);

  return layers;
}
