/** Presentation only: source labels/IDs and partial-boundary metadata remain immutable. */
export function headLabel(entry:{label:string}):string {
  return entry.label.replace(/\s*(?:[—–-]\s*)?regional mask\s*$/i,'').trim();
}

/** Keep the mask's hue, lifting dark colours for readable ink over the dark label plate. */
export function annotationInk(color:number[]):string {
  const base=color.map(value=>Math.max(0,Math.min(1,value)));
  let rgb=base;
  const luminance=(values:number[])=>values.map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
  for(let mix=0;luminance(rgb)<.36&&mix<1;mix+=.05)rgb=base.map(v=>v+(1-v)*mix);
  return `rgb(${rgb.map(v=>Math.round(v*255)).join(',')})`;
}
