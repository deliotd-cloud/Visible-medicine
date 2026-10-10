import { Vector3, type Camera } from 'three';

export type ScreenAnchor = { x: number; y: number };
export type ScreenLabel = ScreenAnchor & {
  id: string;
  width: number;
  height: number;
  selected?: boolean;
  priority?: number;
};
export type PlacedLabel = ScreenLabel & {
  side: 'left' | 'right';
  left: number;
  top: number;
  endX: number;
  endY: number;
  leader: ScreenAnchor[];
};

const routeEpsilon = 1e-7;
function segmentsMeet(a: ScreenAnchor, b: ScreenAnchor, c: ScreenAnchor, d: ScreenAnchor) {
  const cross = (u: ScreenAnchor, v: ScreenAnchor) => u.x * v.y - u.y * v.x;
  const ab = { x: b.x - a.x, y: b.y - a.y };
  const cd = { x: d.x - c.x, y: d.y - c.y };
  const ac = { x: c.x - a.x, y: c.y - a.y };
  const denominator = cross(ab, cd);
  if (Math.abs(denominator) < routeEpsilon) {
    if (Math.abs(cross(ac, ab)) > routeEpsilon) return false;
    const axis = Math.abs(ab.x) >= Math.abs(ab.y) ? 'x' : 'y';
    const overlap = Math.min(Math.max(a[axis], b[axis]), Math.max(c[axis], d[axis])) -
      Math.max(Math.min(a[axis], b[axis]), Math.min(c[axis], d[axis]));
    return overlap > routeEpsilon;
  }
  const t = cross(ac, cd) / denominator;
  const u = cross(ac, ab) / denominator;
  // Coincident anchors and box endpoints are unavoidable and are not crossings.
  return t >= -routeEpsilon && t <= 1 + routeEpsilon &&
    u >= -routeEpsilon && u <= 1 + routeEpsilon &&
    !((t <= routeEpsilon || t >= 1 - routeEpsilon) &&
      (u <= routeEpsilon || u >= 1 - routeEpsilon));
}
function routesMeet(a: ScreenAnchor[], b: ScreenAnchor[]) {
  for (let i = 1; i < a.length; i++)
    for (let j = 1; j < b.length; j++)
      if (segmentsMeet(a[i - 1], a[i], b[j - 1], b[j])) return true;
  return false;
}
function routeColumn(labels: PlacedLabel[]) {
  if (labels.length < 2) return;
  // Most frames already have clear straight leaders. Avoid the bounded search
  // and length calculations unless there is a real pairwise conflict to fix.
  if (!labels.some((label, i) => labels.slice(0, i)
    .some(other => routesMeet(label.leader, other.leader)))) return;
  const options = labels.map((label) => {
    const start = { x: label.x, y: label.y };
    const end = { x: label.endX, y: label.endY };
    return [
      [start, end],
      [start, { x: end.x, y: start.y }, end],
      [start, { x: start.x, y: end.y }, end],
    ].filter(route => route.every(point => Number.isFinite(point.x) && Number.isFinite(point.y)));
  });
  const choices = labels.map(() => 0);
  const routeCost = (index: number, choice: number) => {
    const route = options[index][choice];
    let length = 0;
    for (let i = 1; i < route.length; i++)
      length += Math.hypot(route[i].x - route[i - 1].x, route[i].y - route[i - 1].y);
    return (length + (route.length - 2) * 12) * (labels[index].selected ? 3 : 1);
  };
  const totalCost = () => {
    let cost = 0;
    for (let i = 0; i < labels.length; i++) {
      cost += routeCost(i, choices[i]);
      for (let j = 0; j < i; j++)
        if (routesMeet(options[i][choices[i]], options[j][choices[j]])) cost += 1_000_000;
    }
    return cost;
  };
  // A bounded local search keeps leaders short and changes only crossings it can
  // improve. Coincident anchors or dense columns may have no clear solution.
  for (let pass = 0; pass < 3; pass++) {
    let changed = false;
    for (let i = labels.length - 1; i >= 0; i--) {
      const previous = choices[i];
      let best = previous, bestCost = totalCost();
      for (let choice = 0; choice < options[i].length; choice++) {
        choices[i] = choice;
        const cost = totalCost();
        if (cost < bestCost - routeEpsilon) { best = choice; bestCost = cost; }
      }
      changed ||= previous !== best;
      choices[i] = best;
    }
    if (!changed) break;
  }
  labels.forEach((label, index) => { label.leader = options[index][choices[index]]; });
}

/** Project the actual world anchor, after all parent/explode transforms.
 * The caller updates camera/world matrices once per frame. Anatomical laterality
 * is deliberately not involved: screen-right changes when the viewer rotates.
 */
export function projectLabelAnchor(
  world: Vector3,
  camera: Camera,
  width: number,
  height: number,
): ScreenAnchor | null {
  if (
    ![world.x, world.y, world.z, width, height].every(Number.isFinite) ||
    width <= 0 ||
    height <= 0
  )
    return null;
  const eye = world.clone().applyMatrix4(camera.matrixWorldInverse);
  if (eye.z >= 0) return null;
  const ndc = world.clone().project(camera);
  if (
    ![ndc.x, ndc.y, ndc.z].every(Number.isFinite) ||
    Math.abs(ndc.x) > 1 ||
    Math.abs(ndc.y) > 1 ||
    Math.abs(ndc.z) > 1
  )
    return null;
  return { x: ((ndc.x + 1) * width) / 2, y: ((1 - ndc.y) * height) / 2 };
}

export const labelGutter = 10;
export function screenLabelMaxWidth(width: number, textScale = 1) {
  if (!Number.isFinite(width) || width <= 0) return 0;
  // Keep the central model area open on narrow canvases. This is based on the
  // actual canvas (including an embedded panel), not the browser's width.
  const scale = Number.isFinite(textScale) ? Math.max(1, Math.min(2, textScale)) : 1;
  const column = (width < 560 ? Math.min(160, width * 0.3) : 216) * scale;
  // offsetWidth is integral. Avoid rejecting a valid browser-measured box whose
  // fractional CSS max-width rounded up by a pixel.
  return Math.max(0, Math.floor(Math.min(column, width / 2 - labelGutter * 2)));
}

export function screenLabelLimitPerSide(width: number, height: number) {
  if (![width, height].every(Number.isFinite) || width <= 40 || height <= 20)
    return 0;
  if (width < 560) return height < 320 ? 1 : 2;
  return height < 240 ? 2 : 8;
}

/** Two independent screen-side columns. Never rebalance to the opposite side.
 * Measured box sizes accommodate wrapping, text enlargement and touch targets.
 * Compact canvases show fewer landmarks to leave the anatomy visible. Crowded
 * columns keep the selected label, then the existing landmark priority. Omitted
 * labels remain selectable through their tissue or the structure list; no
 * anatomical item is hidden and no extra scrolling/control is introduced.
 */
export function layoutScreenLabels(
  labels: readonly ScreenLabel[],
  width: number,
  height: number,
): PlacedLabel[] {
  if (
    ![width, height].every(Number.isFinite) ||
    width <= labelGutter * 4 ||
    height <= labelGutter * 2
  )
    return [];
  const valid = labels.filter(
    (label, index) =>
      labels.findIndex((other) => other.id === label.id) === index &&
      [label.x, label.y, label.width, label.height].every(Number.isFinite) &&
      label.x >= 0 &&
      label.x <= width &&
      label.y >= 0 &&
      label.y <= height &&
      label.width > 0 &&
      // Enlarged text can use more of its own half, but never cross the centre
      // or consume the protected gap between the two columns.
      label.width <= screenLabelMaxWidth(width, 2) &&
      label.height > 0,
  );
  const result: PlacedLabel[] = [];
  const gap = 6,
    available = height - labelGutter * 2,
    limit = screenLabelLimitPerSide(width, height);
  for (const side of ['left', 'right'] as const) {
    const resultStart = result.length;
    const candidates = valid.filter(
      (label) => (label.x < width / 2 ? 'left' : 'right') === side,
    );
    candidates.sort(
      (a, b) =>
        Number(!!b.selected) - Number(!!a.selected) ||
        (a.priority ?? 0) - (b.priority ?? 0) ||
        a.id.localeCompare(b.id),
    );
    let used = 0;
    const accepted: ScreenLabel[] = [];
    for (const label of candidates) {
      if (accepted.length >= limit) break;
      const space = label.height + (accepted.length ? gap : 0);
      if (used + space <= available) {
        accepted.push(label);
        used += space;
      }
    }
    accepted.sort((a, b) => a.y - b.y || a.id.localeCompare(b.id));
    const tops: number[] = [];
    for (let i = 0; i < accepted.length; i++) {
      const label = accepted[i];
      const previousBottom = i
        ? tops[i - 1] + accepted[i - 1].height + gap
        : labelGutter;
      tops.push(Math.max(previousBottom, label.y - label.height / 2));
    }
    // Backward packing retains order while bringing the bottom row into view.
    let bottom = height - labelGutter;
    for (let i = accepted.length - 1; i >= 0; i--) {
      tops[i] = Math.min(tops[i], bottom - accepted[i].height);
      bottom = tops[i] - gap;
    }
    // An extracted or panned structure can enter a label gutter. Do not cover
    // its own anchor when this column has room above/below it. Preserve screen
    // side, selected-label priority, vertical order and all neighbouring boxes.
    // This protects an anchor, not a projected whole-tissue occlusion proof.
    for (let i = 0; i < accepted.length; i++) {
      const label = accepted[i];
      const left = side === 'left' ? labelGutter : width - labelGutter - label.width;
      const clearance = 12;
      if (label.x < left - clearance || label.x > left + label.width + clearance)
        continue;
      const low = i ? tops[i - 1] + accepted[i - 1].height + gap : labelGutter;
      const high = (i + 1 < accepted.length ? tops[i + 1] - gap : height - labelGutter) - label.height;
      const clear = (top: number) =>
        top + label.height <= label.y - clearance || top >= label.y + clearance;
      if (clear(tops[i])) continue;
      const options = [label.y - label.height - clearance, label.y + clearance]
        .map(top => Math.max(low, Math.min(high, top)))
        .filter(top => top >= low && top <= high && clear(top))
        .sort((a, b) => Math.abs(a - tops[i]) - Math.abs(b - tops[i]));
      if (options.length) tops[i] = options[0];
    }
    accepted.forEach((label, i) => {
      const left =
        side === 'left' ? labelGutter : width - labelGutter - label.width;
      result.push({
        ...label,
        side,
        left,
        top: tops[i],
        endX: side === 'left' ? left + label.width : left,
        endY: tops[i] + label.height / 2,
        leader: [{ x: label.x, y: label.y }, {
          x: side === 'left' ? left + label.width : left,
          y: tops[i] + label.height / 2,
        }],
      });
    });
    routeColumn(result.slice(resultStart));
  }
  return result;
}
