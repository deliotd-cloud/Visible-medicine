import type {LoadedStudy,LocalHeadPackage,Modality} from './head-atlas-import';
import type {Plane,Vec3} from './head-atlas-geometry.mjs';

/** Only this opaque key enters browser history. Native positions stay in tab memory. */
export const HEAD_VIEW_ENTRY_KEY='__visibleMedicineHeadViewEntry';
export const HEAD_VIEW_EXTERNAL_HISTORY_KEY='__vinext_externalHistoryState';
export type HeadHistoryView={cursor:Vec3;layout:Plane|'multiplanar';windowing:[number,number]};
export type HeadHistoryScope={pkg:LocalHeadPackage;study:LoadedStudy;modality:Modality;revision:string};
type SourceStamp={packageId:number;studyId:number;configured:boolean;modality:Modality;revision:string;shape:[number,number,number];imageSha256:string;imageFile:string;imageDtype:string};
type Receipt={href:string;source:SourceStamp|null;view:HeadHistoryView|null};
const layouts=new Set<HeadHistoryView['layout']>(['axial','coronal','sagittal','multiplanar']);
const record=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
const shapeFor=(scope:HeadHistoryScope):[number,number,number]|null=>{
  const definition=scope.pkg?.manifest?.studies?.[scope.modality];
  const saved=scope.study?.definition?.image?.shape_kji;
  const loaded=scope.study?.geometry?.shapeKJI;
  if((scope.modality!=='CT'&&scope.modality!=='MRI')||!scope.revision||definition!==scope.study.definition||
    !Array.isArray(saved)||!Array.isArray(loaded)||saved.length!==3||loaded.length!==3||
    !saved.every((n,index)=>Number.isSafeInteger(n)&&n>0&&n<=4096&&n===loaded[index]))return null;
  return [saved[0],saved[1],saved[2]];
};
const validView=(view:unknown,shape:readonly number[]):view is HeadHistoryView=>{
  if(!record(view)||Object.keys(view).length!==3||!['cursor','layout','windowing'].every(key=>Object.hasOwn(view,key))||
    !layouts.has(view.layout as HeadHistoryView['layout']))return false;
  const cursor=view.cursor,windowing=view.windowing;
  return Array.isArray(cursor)&&cursor.length===3&&cursor.every((n,index)=>Number.isSafeInteger(n)&&n>=0&&n<shape[2-index])&&
    Array.isArray(windowing)&&windowing.length===2&&windowing.every(n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=1_000_000)&&windowing[1]>=1;
};
const copy=(view:HeadHistoryView):HeadHistoryView=>({cursor:[...view.cursor],layout:view.layout,windowing:[...view.windowing]});
const tokenFrom=(state:unknown)=>record(state)&&typeof state[HEAD_VIEW_ENTRY_KEY]==='string'&&
  state[HEAD_VIEW_ENTRY_KEY].length>=8&&state[HEAD_VIEW_ENTRY_KEY].length<=128?state[HEAD_VIEW_ENTRY_KEY] as string:null;

/** Bounded, process-local receipts. A reload or evicted entry falls back to canonical focus. */
export function createHeadViewHistory(limit=64,newToken=()=>globalThis.crypto?.randomUUID?.()??null){
  const entries=new Map<string,Receipt>();
  const ids=new WeakMap<object,number>();let nextId=0;
  const identity=(value:object)=>{let id=ids.get(value);if(!id){id=++nextId;ids.set(value,id);}return id;};
  function stamp(scope:HeadHistoryScope):SourceStamp|null{
    const shape=shapeFor(scope);if(!shape)return null;
    const image=scope.study.definition.image;
    return {packageId:identity(scope.pkg),studyId:identity(scope.study.definition),
      configured:scope.pkg.source==='configured-local',modality:scope.modality,revision:scope.revision,shape,
      imageSha256:image.sha256,imageFile:image.file,imageDtype:image.dtype};
  }
  const matches=(older:SourceStamp,current:SourceStamp)=>older.modality===current.modality&&
    older.revision===current.revision&&older.shape.every((n,index)=>n===current.shape[index])&&
    older.imageSha256===current.imageSha256&&older.imageFile===current.imageFile&&older.imageDtype===current.imageDtype&&
    (older.packageId===current.packageId&&older.studyId===current.studyId||
      // Configured SSD packages are reverified on each route mount. Bind a
      // fresh object to the exact admitted image and manifest revision only.
      older.configured&&current.configured&&/^[0-9a-f]{64}$/i.test(older.imageSha256));
  function touch(token:string,receipt:Receipt){
    entries.delete(token);entries.set(token,receipt);
    while(entries.size>limit)entries.delete(entries.keys().next().value!);
  }
  return {
    /** Preserve every framework field; a token copied to another URL is not an entry. */
    ensure(state:unknown,href:string):{state:Record<string,unknown>;token:string;changed:boolean}|null{
      if(!record(state)||typeof href!=='string'||href.length>2048||limit<1)return null;
      const old=tokenFrom(state),known=old?entries.get(old):undefined;
      if(old&&known?.href===href)return {state,token:old,changed:false};
      const token=newToken();
      if(typeof token!=='string'||token.length<8||token.length>128||entries.has(token))return null;
      touch(token,{href,source:null,view:null});
      return {state:{...state,[HEAD_VIEW_ENTRY_KEY]:token},token,changed:true};
    },
    freshExternalState(state:unknown):unknown{
      if(!record(state))return state;
      // Vinext treats copied indexed app state as traversal. Mark this
      // app-initiated push as external so its controller allocates a new index.
      const next={...state};delete next[HEAD_VIEW_ENTRY_KEY];
      next[HEAD_VIEW_EXTERNAL_HISTORY_KEY]=true;
      return next;
    },
    save(state:unknown,href:string,scope:HeadHistoryScope,view:unknown):boolean{
      const token=tokenFrom(state),old=token&&entries.get(token),source=stamp(scope);
      if(!token||!old||old.href!==href||!source||!validView(view,source.shape))return false;
      touch(token,{href,source,view:copy(view)});return true;
    },
    read(state:unknown,href:string,scope:HeadHistoryScope):HeadHistoryView|null{
      const token=tokenFrom(state),entry=token&&entries.get(token),source=stamp(scope);
      if(!entry||entry.href!==href||!entry.view||!entry.source||!source||
        !matches(entry.source,source)||!validView(entry.view,source.shape))return null;
      touch(token,entry);return copy(entry.view);
    },
    clearPackage(pkg:LocalHeadPackage){const id=ids.get(pkg);for(const [token,entry] of entries)if(entry.source&&(
      entry.source.packageId===id||pkg.source==='configured-local'&&entry.source.configured))entries.delete(token);},
    clear(){entries.clear();},
    size(){return entries.size;},
  };
}

export const headViewHistory=createHeadViewHistory();
