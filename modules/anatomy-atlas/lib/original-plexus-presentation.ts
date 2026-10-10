import { CubicBezierCurve3, Vector3 } from 'three';
import type { PlexusPart, PlexusStage } from './original-plexus';

// Independently authored diagram coordinates. These are not anatomical millimetres,
// a cadaver trajectory, fibre tracing, or a transform into the body/scan frame.
export type DiagramPoint = [number, number, number];
export type DiagramSegment = { start: DiagramPoint; end: DiagramPoint; stage: PlexusStage };
const segment = (stage: PlexusStage, start: DiagramPoint, end: DiagramPoint): DiagramSegment => ({ stage, start, end });
export const plexusDiagram: Record<string, DiagramSegment> = {
  'ramus.C5': segment('ramus', [-7, 3, 0], [-5, 3, 0]),
  'ramus.C6': segment('ramus', [-7, 1.5, 0], [-5, 1.5, 0]),
  'ramus.C7': segment('ramus', [-7, 0, 0], [-5, 0, 0]),
  'ramus.C8': segment('ramus', [-7, -1.5, 0], [-5, -1.5, 0]),
  'ramus.T1': segment('ramus', [-7, -3, 0], [-5, -3, 0]),
  'trunk.upper': segment('trunk', [-4, 2.25, 0], [-3.1, 2.25, 0]),
  'trunk.middle': segment('trunk', [-4, 0, 0], [-3.1, 0, 0]),
  'trunk.lower': segment('trunk', [-4, -2.25, 0], [-3.1, -2.25, 0]),
  'division.upper.anterior': segment('division', [-3.1, 2.25, 0], [-.2, 1.7, .6]),
  'division.middle.anterior': segment('division', [-3.1, 0, 0], [-.2, 1.7, .6]),
  'division.lower.anterior': segment('division', [-3.1, -2.25, 0], [-.2, -2.35, .6]),
  'division.upper.posterior': segment('division', [-3.1, 2.25, 0], [-.2, -.15, -.8]),
  'division.middle.posterior': segment('division', [-3.1, 0, 0], [-.2, -.15, -.8]),
  'division.lower.posterior': segment('division', [-3.1, -2.25, 0], [-.2, -.15, -.8]),
  'cord.lateral': segment('cord', [.2, 1.7, .6], [2.4, 1.7, .6]),
  'cord.medial': segment('cord', [.2, -2.35, .6], [2.4, -2.35, .6]),
  'cord.posterior': segment('cord', [.2, -.15, -.8], [2.4, -.15, -.8]),
  'median_root.lateral': segment('median-root', [2.4, 1.7, .6], [4.8, -.85, .6]),
  'median_root.medial': segment('median-root', [2.4, -2.35, .6], [4.8, -.85, .6]),
  'nerve.musculocutaneous': segment('nerve', [2.4, 1.7, .6], [7.4, 1.9, .6]),
  'nerve.median': segment('nerve', [4.8, -.85, .6], [7.4, -.85, .6]),
  'nerve.ulnar': segment('nerve', [2.4, -2.35, .6], [7.4, -3.4, .6]),
  'nerve.axillary': segment('nerve', [2.4, -.15, -.8], [7.4, .35, -.8]),
  'nerve.radial': segment('nerve', [2.4, -.15, -.8], [7.4, -2, -.8]),
  'nerve.dorsal_scapular': segment('nerve', [-5, 3, 0], [-4.9, 4.6, -.3]),
  'nerve.long_thoracic': segment('nerve', [-4.5, -4.3, -1.7], [-1.7, -5, -1.7]),
  'nerve.suprascapular': segment('nerve', [-3.1, 2.25, 0], [-1.1, 4.5, -.2]),
  'nerve.to_subclavius': segment('nerve', [-3.1, 2.25, 0], [.6, 4.1, 1]),
  'nerve.lateral_pectoral': segment('nerve', [2.4, 1.7, .6], [4.1, 3.55, 1.6]),
  'nerve.medial_pectoral': segment('nerve', [2.4, -2.35, .6], [5.8, 3.4, 2]),
  'nerve.upper_subscapular': segment('nerve', [2.4, -.15, -.8], [3.2, 3.6, -1.5]),
  'nerve.lower_subscapular': segment('nerve', [2.4, -.15, -.8], [6.8, -4.8, -1.5]),
  'nerve.thoracodorsal': segment('nerve', [2.4, -.15, -.8], [4.2, -5.1, -1.7]),
  'nerve.medial_cutaneous_arm': segment('nerve', [2.4, -2.35, .6], [4.1, -4.3, 1.4]),
  'nerve.medial_cutaneous_forearm': segment('nerve', [2.4, -2.35, .6], [5.8, -4.65, 1.4]),
};
export const terminalKeys = new Set(['nerve.musculocutaneous', 'nerve.median', 'nerve.ulnar', 'nerve.axillary', 'nerve.radial']);
export const isCollateral = (part: PlexusPart) => part.stage === 'nerve' && !terminalKeys.has(part.key);
const stageOffset: Record<PlexusStage, number> = { ramus: -2, trunk: -1, division: 0, cord: 1, 'median-root': 1.5, nerve: 2 };
export function spreadPoint(point: DiagramPoint, stage: PlexusStage, amount: number): DiagramPoint {
  const safe = Math.max(0, Math.min(1, Number.isFinite(amount) ? amount : 0));
  return [point[0] + stageOffset[stage] * safe, point[1], point[2] * (1 + safe * 2)];
}
export function segmentCurve(key: string, spread = 0): CubicBezierCurve3 {
  const item = plexusDiagram[key];
  if (!item) throw new Error(`Unknown original diagram segment: ${key}`);
  return diagramCurve(spreadPoint(item.start, item.stage, spread), spreadPoint(item.end, item.stage, spread));
}
export function diagramCurve(start: DiagramPoint, end: DiagramPoint): CubicBezierCurve3 {
  const dx = Math.max(.35, Math.abs(end[0] - start[0]) * .42);
  return new CubicBezierCurve3(new Vector3(...start), new Vector3(start[0] + dx, start[1], start[2]), new Vector3(end[0] - dx, end[1], end[2]), new Vector3(...end));
}
export function connectionCurve(from: string, to: string, spread = 0): CubicBezierCurve3 | null {
  const a = plexusDiagram[from], b = plexusDiagram[to];
  if (!a || !b) throw new Error('Unknown original diagram connection');
  const start = spreadPoint(a.end, a.stage, spread), end = spreadPoint(b.start, b.stage, spread);
  if (new Vector3(...start).distanceTo(new Vector3(...end)) < .001) return null;
  // Separate contributing rami to the long thoracic nerve in illustrative depth,
  // not through other node junctions. Crossings without a node are not joins.
  if (to === 'nerve.long_thoracic') return new CubicBezierCurve3(new Vector3(...start), new Vector3(start[0] + .3, start[1], -2.2), new Vector3(end[0] - .5, end[1], -2.2), new Vector3(...end));
  return diagramCurve(start, end);
}
export const stageNames: Record<PlexusStage, string> = { ramus: 'Anterior rami', trunk: 'Trunks', division: 'Divisions', cord: 'Cords', 'median-root': 'Median contributions', nerve: 'Nerves' };

/** Fit the current schematic, not a body/scan or anatomical-size calculation. */
export function diagramFit(keys: string[], spread: number, aspect: number, fov = 42, direction: DiagramPoint = [0,0,1]): { target: DiagramPoint; distance: number } {
  const points = keys.flatMap(key => {const s=plexusDiagram[key];return s?[spreadPoint(s.start,s.stage,spread),spreadPoint(s.end,s.stage,spread)]:[];});
  if(!points.length) return {target:[0,0,0],distance:14};
  const mins=[0,1,2].map(axis=>Math.min(...points.map(p=>p[axis]))), maxs=[0,1,2].map(axis=>Math.max(...points.map(p=>p[axis])));
  const ratio=Number.isFinite(aspect)&&aspect>0?aspect:1;
  const tangent=Math.tan(Math.max(20,Math.min(80,fov))*Math.PI/360);
  const target=mins.map((v,i)=>(v+maxs[i])/2) as DiagramPoint;
  const back=new Vector3(...direction);
  if(!back.toArray().every(Number.isFinite)||back.lengthSq()<.001) back.set(0,0,1);
  back.normalize();
  const up=Math.abs(back.y)>.95?new Vector3(0,0,1):new Vector3(0,1,0);
  const right=new Vector3().crossVectors(up,back).normalize(), cameraUp=new Vector3().crossVectors(back,right).normalize();
  let distance=6;
  // Fit every corner in the chosen camera frame, including oblique/posterior.
  // The front-view bounding box alone does not protect tilted lower branches.
  for(const x of [mins[0],maxs[0]]) for(const y of [mins[1],maxs[1]]) for(const z of [mins[2],maxs[2]]) {
    const relative=new Vector3(x-target[0],y-target[1],z-target[2]);
    distance=Math.max(distance,Math.abs(relative.dot(cameraUp))*1.28/tangent+relative.dot(back),Math.abs(relative.dot(right))*1.2/(tangent*ratio)+relative.dot(back));
  }
  return {target,distance};
}
