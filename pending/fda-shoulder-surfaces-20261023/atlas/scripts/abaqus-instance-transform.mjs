// Abaqus *INSTANCE placement in source assembly coordinates only.
// https://docs.software.vt.edu/abaqusv2025/English/SIMACAEKEYRefMap/simakey-r-instance.htm
// The optional translation is applied before rotation about the global a->b axis.

function finite(value, label) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new RangeError(`${label} must be a finite number`);
  }
  return value;
}

function row(value, length, label) {
  if (!Array.isArray(value) || value.length !== length) {
    throw new TypeError(`${label} must be an array of ${length} numbers`);
  }
  return Array.from(value, (entry, index) => finite(entry, `${label}[${index}]`));
}

/**
 * Place one part-coordinate point using Abaqus *INSTANCE data rows.
 * [] is identity; [translation] translates; [translation, rotation] first
 * translates and then rotates about the global a->b line, in degrees.
 * Returns a fresh array and never changes either input.
 */
export function transformInstancePoint(point, transformRows) {
  const [px, py, pz] = row(point, 3, 'point');
  if (!Array.isArray(transformRows) || transformRows.length > 2) {
    throw new TypeError('transformRows must contain zero, one, or two rows');
  }
  if (transformRows.length === 0) return [px, py, pz];

  const [tx, ty, tz] = row(transformRows[0], 3, 'translation');
  const x = finite(px + tx, 'translated x');
  const y = finite(py + ty, 'translated y');
  const z = finite(pz + tz, 'translated z');
  if (transformRows.length === 1) return [x, y, z];

  const [ax, ay, az, bx, by, bz, angle] = row(transformRows[1], 7, 'rotation');
  const dx = finite(bx - ax, 'axis x');
  const dy = finite(by - ay, 'axis y');
  const dz = finite(bz - az, 'axis z');
  const length = finite(Math.hypot(dx, dy, dz), 'axis length');
  if (length === 0) throw new RangeError('rotation axis must have distinct endpoints');
  const ux = dx / length;
  const uy = dy / length;
  const uz = dz / length;
  const radians = finite(angle * (Math.PI / 180), 'angle in radians');
  const sine = Math.sin(radians);
  const cosine = Math.cos(radians);
  const vx = finite(x - ax, 'relative x');
  const vy = finite(y - ay, 'relative y');
  const vz = finite(z - az, 'relative z');
  const dot = finite(ux * vx + uy * vy + uz * vz, 'axis projection');
  const crossX = finite(uy * vz - uz * vy, 'cross x');
  const crossY = finite(uz * vx - ux * vz, 'cross y');
  const crossZ = finite(ux * vy - uy * vx, 'cross z');
  const complement = 1 - cosine;
  return [
    finite(ax + finite(vx * cosine + crossX * sine + ux * dot * complement, 'rotated x'), 'output x'),
    finite(ay + finite(vy * cosine + crossY * sine + uy * dot * complement, 'rotated y'), 'output y'),
    finite(az + finite(vz * cosine + crossZ * sine + uz * dot * complement, 'rotated z'), 'output z'),
  ];
}
