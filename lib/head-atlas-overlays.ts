import type {HeadEntry,LoadedEntry} from './head-atlas-import';

const families:Record<string,string>={ctx:'Cortex & lobes',bst:'Brainstem',cer:'Cerebellum',dgm:'Deep grey matter',vnt:'Ventricles & CSF',vas:'Vessels',skl:'Skull',wmt:'White matter',cis:'Cisterns',men:'Meninges',orb:'Orbits',sns:'Sinuses',ear:'Ear',sel:'Sellar region',fac:'Face',sft:'Soft tissues',nck:'Neck'};
export const HEAD_OVERLAY_BYTE_LIMIT=256*1024*1024;
/** Display sets only: original labels, scope, masks and review status are unchanged. */
export function groupHeadOverlays(entries:HeadEntry[]){
  const groups=new Map<string,HeadEntry[]>(),seen=new Set<string>();
  for(const entry of entries){
    // A shared source in another release is not necessarily a duplicate in this
    // study. Deduplicate actual geometry, not all source-alias declarations.
    if(!entry.mask||seen.has(entry.mask.sha256))continue;
    seen.add(entry.mask.sha256);const group=groups.get(entry.family)??[];group.push(entry);groups.set(entry.family,group);
  }
  return [...groups].map(([id,entries])=>({id,label:families[id]??id,entries}));
}
export function headOverlayBytes(entries:HeadEntry[]):number{
  // Distinct entry objects can own separate buffers even with a shared hash.
  // The verified group loader shares the exact selected entry's buffer.
  let sum=0;
  for(const entry of new Set(entries)){
    if(!entry.mask)continue;
    const shape=entry.mask.shape_kji;
    if(entry.mask.dtype!=='uint8'||!Array.isArray(shape)||shape.length!==3||shape.some(v=>!Number.isSafeInteger(v)||v<1||v>4096))return Infinity;
    const count=shape.reduce((n,v)=>n*v,1);
    if(count>128*1024*1024)return Infinity;
    sum+=count;if(!Number.isSafeInteger(sum))return Infinity;
  }
  return sum;
}
export function visibleHeadOverlays(layers:LoadedEntry[],hidden:Set<string>,selected:LoadedEntry|null):LoadedEntry[]{
  // Guard the render between a selection change and group-effect cleanup too.
  if(headOverlayBytes([...layers.map(layer=>layer.entry),...(selected?[selected.entry]:[])])>HEAD_OVERLAY_BYTE_LIMIT)return selected?[selected]:[];
  const result=layers.filter(layer=>!hidden.has(layer.entry.id)&&layer.entry.mask?.sha256!==selected?.entry.mask?.sha256);
  if(selected)result.push(selected);return result;
}
export type HeadLabelAnchor={id:string;x:number;y:number;text:string;selected?:boolean};
/** Screen-side columns with deterministic order, no overlap, bounded density. */
export function layoutHeadLabels(anchors:HeadLabelAnchor[],width:number,height:number,maxLabels=12){
  const capacity=Math.max(0,Math.min(Math.floor((height-48)/36),Math.floor(maxLabels/2))),labels:Array<HeadLabelAnchor&{boxX:number;boxY:number;boxWidth:number;boxHeight:number}>=[];
  if(!Number.isFinite(width)||!Number.isFinite(height)||width<100||height<84)return {labels,omitted:anchors.length};
  for(const left of [true,false]){
    const candidates=anchors.filter(a=>Number.isFinite(a.x)&&Number.isFinite(a.y)&&(a.x<width/2)===left).sort((a,b)=>Number(!!b.selected)-Number(!!a.selected)||a.y-b.y||a.id.localeCompare(b.id)).slice(0,capacity).sort((a,b)=>a.y-b.y||a.id.localeCompare(b.id));
    candidates.forEach((anchor,index)=>{
      const boxWidth=Math.min(260,width*.43),boxHeight=30;
      labels.push({...anchor,boxX:left?8:width-8-boxWidth,boxY:24+index*36,boxWidth,boxHeight});
    });
  }
  return {labels,omitted:anchors.length-labels.length};
}
