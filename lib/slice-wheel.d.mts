export function bindSliceWheel(target: HTMLElement, options: {getSlice:()=>number; sliceCount:number; onSlice:(slice:number)=>void; pagePixels?:()=>number}):()=>void;
