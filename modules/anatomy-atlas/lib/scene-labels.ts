type Point = [number, number, number];
type Bounds = { min: readonly number[]; max: readonly number[] };
export type LabelView =
  | 'anterior'
  | 'posterior'
  | 'right'
  | 'left'
  | 'superior'
  | 'inferior';
const axes: Record<LabelView, { right: Point; up: Point }> = {
  anterior: { right: [1, 0, 0], up: [0, 1, 0] },
  posterior: { right: [-1, 0, 0], up: [0, 1, 0] },
  right: { right: [0, 0, 1], up: [0, 1, 0] },
  left: { right: [0, 0, -1], up: [0, 1, 0] },
  superior: { right: [1, 0, 0], up: [0, 0, -1] },
  inferior: { right: [1, 0, 0], up: [0, 0, 1] },
};
export function sceneLabelIds(
  selected: string | null,
  landmarks: string[],
  visibleIds: string[],
  focus: boolean,
): string[] {
  const ordered = focus && selected ? [selected] : [selected, ...landmarks];
  return [
    ...new Set(
      ordered.filter((id): id is string => !!id && visibleIds.includes(id)),
    ),
  ].slice(0, 8);
}
/** View-aligned columns within the fitted visual bounds, not the full hidden body. */
export function sceneLabelEndpoint(
  bounds: Bounds,
  view: LabelView,
  index: number,
  count: number,
  offset: readonly number[] = [0, 0, 0],
): Point {
  if (
    !Number.isInteger(index) ||
    !Number.isInteger(count) ||
    count < 1 ||
    !axes[view] ||
    index < 0 ||
    index >= count ||
    count > 8 ||
    [...bounds.min, ...bounds.max, ...offset].some(
      (v) => !Number.isFinite(v),
    ) ||
    bounds.min.length !== 3 ||
    bounds.max.length !== 3 ||
    offset.length !== 3 ||
    bounds.min.some((v, k) => v > bounds.max[k])
  )
    throw Error('Invalid scene label layout');
  const { right, up } = axes[view];
  const size = bounds.max.map((v, k) => v - bounds.min[k]);
  const span = (axis: Point) =>
    size.reduce((sum, v, k) => sum + v * Math.abs(axis[k]), 0);
  const width = span(right),
    height = span(up);
  const rows = Math.ceil(count / 2);
  const horizontal =
    (index % 2 === 0 ? -1 : 1) * Math.max(width * 0.48, height * 0.1, 0.002);
  const vertical =
    rows === 1
      ? 0
      : height * 0.38 * (1 - (2 * Math.floor(index / 2)) / (rows - 1));
  return bounds.min.map(
    (v, k) =>
      (v + bounds.max[k]) / 2 +
      right[k] * horizontal +
      up[k] * vertical -
      offset[k],
  ) as Point;
}
