// Local QA reporter for bounded stock shards. Emits only selected, bounded fields.
// The native spec and TAP reporters remain active and authoritative for totals.
const bounded=(value,max=512)=>{
 if(typeof value!=='string')return null;
 return value.replace(/[\u0000-\u001f\u007f]/g,' ').slice(0,max);
};
const finite=value=>typeof value==='number'&&Number.isFinite(value)?value:null;
const counts=data=>{
 const src=data?.counts&&typeof data.counts==='object'?data.counts:data;
 const out={};for(const key of ['tests','passed','failed','cancelled','skipped','todo','suites','topLevel']){
  if(Number.isSafeInteger(src?.[key])&&src[key]>=0)out[key]=src[key];
 }return out;
};
export default async function* structuredTestReporter(events){
 for await(const event of events){
  if(!['test:pass','test:fail','test:summary'].includes(event?.type))continue;
  const data=event.data??{},error=data.details?.error??data.error??null;
  const row={event:event.type,file:bounded(data.file,1024),name:bounded(data.name,512),
   line:finite(data.line),column:finite(data.column),nesting:finite(data.nesting),
   testNumber:finite(data.testNumber),duration_ms:finite(data.details?.duration_ms??data.duration_ms),
   failureType:bounded(error?.failureType??data.failureType,128),
   code:bounded(error?.code??data.code,128),message:bounded(error?.message,1024)};
  if(event.type==='test:summary'){row.counts=counts(data);row.success=typeof data.success==='boolean'?data.success:null;}
  yield JSON.stringify(row)+'\n';
 }
}