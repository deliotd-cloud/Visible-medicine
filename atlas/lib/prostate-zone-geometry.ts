import * as THREE from 'three';
import type { ProstateZoneKey } from './prostate-zones';

/** Original, normalized teaching geometry. No patient voxels or licensed mesh are sampled.
 * X = patient left, Y = superior/base, Z = anterior. Values are not millimetres.
 * These analytic compartments illustrate relationships, not validated boundaries.
 */
export const PROSTATE_ZONE_KEYS: readonly ProstateZoneKey[] = ['peripheral', 'transition', 'central', 'stroma'];
type Point = [number, number, number];
const radius = 1.3;
export function prostateFields(x: number, y: number, z: number): Record<ProstateZoneKey, number> {
  const anterior = (z + 0.06 + 0.10 * y) / (0.77 + 0.06 * y);
  const gland = 1 - (x / (1.08 + 0.10 * y)) ** 2 - ((y - 0.04) / 0.84) ** 2 - anterior ** 2;
  // Leave a schematic urethral channel; it is not an imported lumen or segmentation.
  const outsideUrethra = Math.hypot(x, z - (0.08 + 0.12 * y)) / 0.05 - 1;
  const common = Math.min(gland, outsideUrethra);
  const anteriorStroma = anterior - 0.69;
  const t = (y + 0.30) / 1.20;
  const coneT = Math.max(0, t);
  const central = Math.min(t, 1 - t,
    1 - (x / (0.045 + 0.58 * coneT)) ** 2
      - ((z + 0.12 + 0.20 * coneT) / (0.055 + 0.28 * coneT)) ** 2);
  const lobe = (side: number) => 1 - ((x - side * 0.20) / 0.32) ** 2
    - ((y - 0.17) / 0.55) ** 2 - ((z - 0.13) / 0.285) ** 2;
  const transition = Math.max(lobe(-1), lobe(1));
  return {
    stroma: Math.min(common, anteriorStroma),
    central: Math.min(common, -anteriorStroma, central),
    transition: Math.min(common, -anteriorStroma, -central, transition),
    peripheral: Math.min(common, -anteriorStroma, -central, -transition),
  };
}
export function prostateZoneAt(x: number, y: number, z: number): ProstateZoneKey | null {
  if (![x, y, z].every(Number.isFinite)) return null;
  const fields = prostateFields(x, y, z);
  return PROSTATE_ZONE_KEYS.find(key => fields[key] > 0) ?? null;
}
function validateResolution(resolution: number, min: number, max: number) {
  if (!Number.isInteger(resolution) || resolution < min || resolution > max)
    throw new RangeError(`Resolution must be an integer from ${min} to ${max}`);
}
function interpolate(a: Point, b: Point, fa: number, fb: number): Point {
  const t = THREE.MathUtils.clamp(fa / (fa - fb), 0, 1);
  return a.map((v, axis) => v + t * (b[axis] - v)) as Point;
}
function outward(key: ProstateZoneKey, p: Point): Point {
  const h = 0.0001;
  return [0, 1, 2].map(axis => {
    const lo = [...p] as Point, hi = [...p] as Point;
    lo[axis] -= h; hi[axis] += h;
    return prostateFields(...lo)[key] - prostateFields(...hi)[key];
  }) as Point;
}
const corners: Point[] = [[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,1],[1,0,1],[1,1,1],[0,1,1]];
// A common body diagonal gives matching triangulation on adjacent cube faces.
const tetrahedra = [[0,5,1,6],[0,1,2,6],[0,2,3,6],[0,3,7,6],[0,7,4,6],[0,4,5,6]];

export function createProstateZoneGeometries(resolution = 64): Record<ProstateZoneKey, THREE.BufferGeometry> {
  validateResolution(resolution, 12, 80);
  const n = resolution + 1, step = 2 * radius / resolution;
  const index = (x: number, y: number, z: number) => (z * n + y) * n + x;
  const points: Point[] = new Array(n ** 3);
  const values = Object.fromEntries(PROSTATE_ZONE_KEYS.map(k => [k, new Float32Array(n ** 3)])) as Record<ProstateZoneKey, Float32Array>;
  for (let z = 0; z < n; z++) for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const i = index(x,y,z), p: Point = [x*step-radius,y*step-radius,z*step-radius]; points[i] = p;
    const fields = prostateFields(...p); for (const key of PROSTATE_ZONE_KEYS) values[key][i] = fields[key];
  }
  return Object.fromEntries(PROSTATE_ZONE_KEYS.map(key => {
    const positions: number[] = [], faces: number[] = [], edges = new Map<string, number>(), coordinates = new Map<string, number>(), field = values[key];
    const vertex = (a: number, b: number) => {
      const edge = a < b ? `${a}:${b}` : `${b}:${a}`, old = edges.get(edge);
      if (old !== undefined) return old;
      // Intersections exactly on a grid vertex can be reached through several
      // edges. Weld at the actual Float32 render precision before adding faces.
      const p = interpolate(points[a], points[b], field[a], field[b])
        .map(value => Math.fround(Math.round(value * 1e8) / 1e8)) as Point;
      const location = p.join(','), shared = coordinates.get(location);
      if (shared !== undefined) { edges.set(edge, shared); return shared; }
      const id = positions.length / 3;
      positions.push(...p); edges.set(edge, id); coordinates.set(location, id); return id;
    };
    const face = (a: number, b: number, c: number) => {
      const p = positions.slice(a*3,a*3+3) as Point, q = positions.slice(b*3,b*3+3) as Point, r = positions.slice(c*3,c*3+3) as Point;
      const u = new THREE.Vector3(...q).sub(new THREE.Vector3(...p)), v = new THREE.Vector3(...r).sub(new THREE.Vector3(...p));
      // Small edge intersections still close the surface; a visual-area cutoff
      // would punch tiny holes into otherwise watertight compartments.
      const normal = u.cross(v); if (normal.lengthSq() === 0) return;
      const centre = p.map((value, axis) => (value+q[axis]+r[axis])/3) as Point;
      if (normal.dot(new THREE.Vector3(...outward(key, centre))) < 0) faces.push(a,c,b); else faces.push(a,b,c);
    };
    for (let z=0;z<resolution;z++) for (let y=0;y<resolution;y++) for (let x=0;x<resolution;x++) {
      const ids = corners.map(([dx,dy,dz])=>index(x+dx,y+dy,z+dz));
      if (ids.every(i=>field[i]<=0)||ids.every(i=>field[i]>0)) continue;
      for (const tet of tetrahedra) {
        const ins=tet.map(i=>ids[i]).filter(i=>field[i]>0), outs=tet.map(i=>ids[i]).filter(i=>field[i]<=0);
        if (ins.length===1) face(vertex(ins[0],outs[0]),vertex(ins[0],outs[1]),vertex(ins[0],outs[2]));
        else if (ins.length===3) face(vertex(outs[0],ins[0]),vertex(outs[0],ins[1]),vertex(outs[0],ins[2]));
        else if (ins.length===2) {
          const a=vertex(ins[0],outs[0]),b=vertex(ins[0],outs[1]),c=vertex(ins[1],outs[0]),d=vertex(ins[1],outs[1]);face(a,b,c);face(b,d,c);
        }
      }
    }
    const geometry = new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(faces);geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();
    geometry.userData={zone:key,representation:'original-schematic',patientSpaceRegistration:null};return [key,geometry];
  })) as Record<ProstateZoneKey, THREE.BufferGeometry>;
}

/** Filled axial section from the very same compartment fields as the 3D surfaces. */
export function createProstateSectionGeometry(key: ProstateZoneKey, level: number, resolution = 80) {
  if (!PROSTATE_ZONE_KEYS.includes(key)) throw new Error('Unknown prostate zone');
  if (!Number.isFinite(level)||Math.abs(level)>1.2) throw new RangeError('Invalid section level');
  validateResolution(resolution,12,160);
  const vertices: number[] = [], step=2*radius/resolution;
  const triangle = (points: Point[]) => {
    const clipped: Point[] = [];
    for (let i=0;i<3;i++) {
      const a=points[i],b=points[(i+1)%3],fa=prostateFields(...a)[key],fb=prostateFields(...b)[key];
      if(fa>=0)clipped.push(a);if((fa>=0)!==(fb>=0))clipped.push(interpolate(a,b,fa,fb));
    }
    for(let i=1;i<clipped.length-1;i++)vertices.push(...clipped[0],...clipped[i],...clipped[i+1]);
  };
  for(let z=0;z<resolution;z++)for(let x=0;x<resolution;x++){
    const a:Point=[x*step-radius,level,z*step-radius],b:Point=[a[0]+step,level,a[2]],c:Point=[a[0]+step,level,a[2]+step],d:Point=[a[0],level,a[2]+step];triangle([a,d,b]);triangle([b,d,c]);
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.computeVertexNormals();return g;
}
