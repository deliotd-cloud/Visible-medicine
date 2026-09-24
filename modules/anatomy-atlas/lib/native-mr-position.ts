import type { NativeMrStudy } from './local-mr-study';

type Geometry = Pick<NativeMrStudy, 'directions' | 'positions' | 'thickness'>;

/** Acquired plane centres projected onto the packet's LPS slice normal. */
export function nativeMrPositions(study: Geometry) {
  const [u, v] = study.directions;
  const normal = [
    u[1] * v[2] - u[2] * v[1],
    u[2] * v[0] - u[0] * v[2],
    u[0] * v[1] - u[1] * v[0],
  ];
  const centres = study.positions.map((origin) =>
    origin.reduce((sum, value, axis) => sum + value * normal[axis], 0),
  );
  return centres.map((position, index) => {
    const previousSpacing = index ? position - centres[index - 1] : null;
    const nextSpacing =
      index < centres.length - 1 ? centres[index + 1] - position : null;
    return {
      index,
      position,
      previousSpacing,
      nextSpacing,
      previousGap:
        previousSpacing === null ? null : previousSpacing - study.thickness,
      nextGap: nextSpacing === null ? null : nextSpacing - study.thickness,
    };
  });
}
