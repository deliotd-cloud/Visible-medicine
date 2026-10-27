// Admission of a course-scoped release draft left by an already-created release.
// This checks binding metadata only; ActionForm still validates every field
// against its mounted controls before mutating the DOM.
export type ReleasePredecessorBinding = {courseId:string; releaseId:string; version:number; availableWorkbookIds:readonly string[]};

const singleFields=['expectedCourseId','expectedReleaseId','expectedVersion','title','slug','summary','level','duration','outcomes','publisherName','publisherKind','visibility','accessModel','enrolmentOpen'] as const;
const allowedFields=new Set<string>([...singleFields,'workbookIds','price','currency']);

export function matchesReleasePredecessor(raw:unknown,binding:ReleasePredecessorBinding):boolean {
  if(typeof raw!=='string'||raw.length===0||raw.length>512*1024||new TextEncoder().encode(raw).byteLength>512*1024||
     !binding.courseId||!binding.releaseId||!Number.isSafeInteger(binding.version)||binding.version<1||
     !Array.isArray(binding.availableWorkbookIds))return false;
  try {
    const saved:unknown=JSON.parse(raw);
    if(!saved||typeof saved!=='object'||Array.isArray(saved))return false;
    const fields=saved as Record<string,unknown>;
    if(Object.keys(fields).some(name=>!allowedFields.has(name))||
       singleFields.some(name=>!Object.hasOwn(fields,name)||typeof fields[name]!=='string')||
       !Object.hasOwn(fields,'workbookIds'))return false;
    const order=fields.workbookIds;
    if(typeof order!=='string'&&!(Array.isArray(order)&&order.every(id=>typeof id==='string'&&id.length>0)))return false;
    if(typeof order==='string'&&order.length===0)return false;
    const selected=Array.isArray(order)?order:order==='false'?[]:[order];
    if(new Set(selected).size!==selected.length||selected.some(id=>!binding.availableWorkbookIds.includes(id)))return false;
    if(fields.price!==undefined&&typeof fields.price!=='string'||fields.currency!==undefined&&typeof fields.currency!=='string')return false;
    if(fields.accessModel==='paid'&&(typeof fields.price!=='string'||typeof fields.currency!=='string'))return false;
    if(!['institution','official'].includes(fields.publisherKind as string)||
       !['private','unlisted','public'].includes(fields.visibility as string)||
       !['free','invitation','institution','paid'].includes(fields.accessModel as string))return false;
    if(!['on','false'].includes(fields.enrolmentOpen as string))return false;
    const version=fields.expectedVersion;
    if(fields.expectedCourseId!==binding.courseId||fields.expectedReleaseId!==binding.releaseId||
       typeof version!=='string'||!/^[1-9]\d*$/.test(version))return false;
    const parsed=Number(version);
    return Number.isSafeInteger(parsed)&&parsed<=binding.version;
  } catch {return false;}
}

export type ReleaseDraftSelection =
  |{source:'primary';raw:string;predecessorRaw:string|null;predecessorUnavailable?:boolean}
  |{source:'predecessor';raw:string;predecessorRaw:string}
  |{source:'none'|'unmatched';raw:null;predecessorRaw:string|null};

// Optional coexistence inspection must never veto an already-read primary.
export function readOptionalPredecessor(read:()=>string|null):{raw:string|null;unavailable:boolean}{
  try{return {raw:read(),unavailable:false};}
  catch{return {raw:null,unavailable:true};}
}

// Readers remain under ActionForm's verified education context. Reading the
// primary again before every refusal or fallback keeps it authoritative if a
// cooperating tab writes between the initial and predecessor reads.
export function selectReleaseDraft(
  initialPrimary:string|null,
  readPrimary:()=>string|null,
  readPredecessor:()=>string|null,
  binding:ReleasePredecessorBinding,
):ReleaseDraftSelection {
  if(initialPrimary!==null)return {source:'primary',raw:initialPrimary,predecessorRaw:null};
  const {raw:predecessorRaw,unavailable}=readOptionalPredecessor(readPredecessor);
  let primary=readPrimary();
  if(primary!==null)return {source:'primary',raw:primary,predecessorRaw,predecessorUnavailable:unavailable};
  if(unavailable)throw new Error('The predecessor draft could not be inspected');
  if(predecessorRaw===null)return {source:'none',raw:null,predecessorRaw};
  const matching=matchesReleasePredecessor(predecessorRaw,binding);
  primary=readPrimary();
  if(primary!==null)return {source:'primary',raw:primary,predecessorRaw};
  return matching?{source:'predecessor',raw:predecessorRaw,predecessorRaw}:{source:'unmatched',raw:null,predecessorRaw};
}
