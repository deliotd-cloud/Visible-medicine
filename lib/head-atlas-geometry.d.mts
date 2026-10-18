export type Vec3 = [number, number, number];
export type Plane = 'axial' | 'coronal' | 'sagittal';
export type NativeView = {
  name: Plane; width: number; height: number; sliceCount: number; fixedAxisIJK: number;
  pixelSpacing: readonly number[]; sliceSpacing: number; oblique: boolean;
  directionLabels: {left:string;right:string;top:string;bottom:string;sliceStart:string;sliceEnd:string};
  pixelToIJK(x:number,y:number,slice:number):Vec3;
  pixelFromIJK(ijk:readonly number[]):{x:number;y:number;slice:number};
};
export type NativeGeometry = {
  shapeKJI: readonly number[]; oblique: boolean; coordinateSystem: string;
  views: Record<Plane,NativeView>; ijkToRas(ijk:readonly number[]):Vec3; rasToIjk(ras:readonly number[]):Vec3;
};
export class NativeVolumeGeometryError extends Error {}
export function createNativeVolumeGeometry(input:{ijk_to_ras:number[][];shape_kji:number[]}):NativeGeometry;
export function flattenKJI(ijk:readonly number[],shape:readonly number[]):number;
export function maskCropIndexForIJK(ijk:readonly number[],crop:{offset_kji:number[];shape_kji:number[]}):number|null;
