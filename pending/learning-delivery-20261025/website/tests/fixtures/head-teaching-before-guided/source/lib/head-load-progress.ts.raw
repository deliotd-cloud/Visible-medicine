/** Numeric, transient load status only: no paths, labels, identifiers or scan bytes. */
export type HeadReadProgress={readonly loadedBytes:number;readonly totalBytes:number};
export type HeadReadObserver=(progress:HeadReadProgress)=>void;
export type HeadStudyProgress=HeadReadProgress&{readonly phase:'reading'|'verifying'};
export type HeadStudyObserver=(progress:HeadStudyProgress)=>void;

/** A display observer must never change whether image integrity checks succeed. */
export function notifyHeadProgress<T>(observer:((progress:T)=>void)|undefined,progress:T):void{
  try{observer?.(progress);}catch{/* Progress display failure must not disclose or replace a source error. */}
}

export function headStudyLoadingMessage(modality:'CT'|'MRI',progress:HeadStudyProgress):string{
  const {loadedBytes,totalBytes}=progress;
  if(!Number.isSafeInteger(loadedBytes)||!Number.isSafeInteger(totalBytes)||totalBytes<1||loadedBytes<0||loadedBytes>totalBytes)return `Opening ${modality} native image…`;
  if(progress.phase==='verifying')return `Verifying ${modality} image checksum…`;
  // Announce coarse real byte progress, not estimated time or every network chunk.
  const percent=Math.floor(loadedBytes/totalBytes*10)*10;
  return `Reading ${modality} native image… ${percent}%`;
}

export const HEAD_CLIENT_TRACE_PREFIX='VM_HEAD_CLIENT ';
export const HEAD_CLIENT_TRACE_LIMIT=128;

export type HeadClientPhase='study-start'|'reading'|'verifying'|'study-data-ready'|'failed'|'cancelled';
export type HeadClientTraceEvent={
  readonly schema:1;
  readonly attempt:number;
  readonly phase:HeadClientPhase;
  readonly elapsedMs:number;
  readonly loadedBytes?:number;
  readonly totalBytes?:number;
};
export type HeadClientTrace=(phase:HeadClientPhase,progress?:HeadReadProgress)=>void;

/** The URL must be the exact origin, and the fragment opt-in must occur once. */
export function headClientDiagnosticsAllowed(buildEnabled:boolean,origin:string,fragment:string):boolean{
  if(buildEnabled!==true||typeof origin!=='string'||typeof fragment!=='string')return false;
  try{
    const url=new URL(origin);
    if(url.protocol!=='http:'||url.origin!==origin||!['localhost','127.0.0.1','[::1]'].includes(url.hostname))return false;
    if(!fragment.startsWith('#'))return false;
    const values=new URLSearchParams(fragment.slice(1)).getAll('headDiagnostics');
    return values.length===1&&values[0]==='1';
  }catch{return false;}
}

const headClientPhases:ReadonlySet<string>=new Set(['study-start','reading','verifying','study-data-ready','failed','cancelled']);
const headClientTerminalPhases:ReadonlySet<string>=new Set(['study-data-ready','failed','cancelled']);
const HEAD_CLIENT_MAX_BYTES=536870912;
const HEAD_CLIENT_MAX_MS=86400000;

function snapshotHeadClientProgress(value:unknown):HeadReadProgress|null{
  if(!value||typeof value!=='object')return null;
  try{
    const {loadedBytes,totalBytes}=value as HeadReadProgress;
    if(Number.isSafeInteger(loadedBytes)&&Number.isSafeInteger(totalBytes)&&
      loadedBytes>=0&&loadedBytes<=HEAD_CLIENT_MAX_BYTES&&totalBytes>=1&&
      totalBytes<=HEAD_CLIENT_MAX_BYTES&&loadedBytes<=totalBytes)return {loadedBytes,totalBytes};
  }catch{/* Untrusted progress getters are diagnostic only. */}
  return null;
}

/** A deliberately injectable, inert-by-default seam for private local diagnostics. */
export function createHeadClientDiagnostics(options:{enabled?:boolean;write?:(line:string)=>void;now?:()=>number}={}){
  let emitted=0;
  let attempts=0;
  const enabled=options.enabled===true&&typeof options.write==='function';
  return function begin():HeadClientTrace|null{
    if(!enabled||emitted>=HEAD_CLIENT_TRACE_LIMIT)return null;
    const attempt=++attempts;
    let started=0;
    try{const value=options.now?.()??Date.now();if(Number.isFinite(value))started=value;}catch{/* Clock failure is diagnostic only. */}
    let lastElapsed=0;
    let lastReadingBucket=-1;
    let lastReadingTotal=0;
    let retired=false;
    const trace:HeadClientTrace=(phase,progress)=>{
      if(retired||emitted>=HEAD_CLIENT_TRACE_LIMIT||!headClientPhases.has(phase)||phase==='study-start')return;
      let bytes:HeadReadProgress|undefined;
      if(progress!==undefined){
        const snapshot=snapshotHeadClientProgress(progress);
        if(!snapshot)return;
        bytes=snapshot;
      }
      if(phase==='reading'&&!bytes)return;
      if(phase==='reading'&&bytes){
        const bucket=Math.floor(bytes.loadedBytes/bytes.totalBytes*10);
        if(bucket<=lastReadingBucket&&bytes.totalBytes===lastReadingTotal)return;
        if(lastReadingBucket>=0&&(bucket<lastReadingBucket||bytes.totalBytes!==lastReadingTotal))return;
        lastReadingBucket=bucket;
        lastReadingTotal=bytes.totalBytes;
        bytes={loadedBytes:bucket===10?bytes.totalBytes:Math.floor(bytes.totalBytes*bucket/10),totalBytes:bytes.totalBytes};
      }
      emit(phase,bytes);
      if(headClientTerminalPhases.has(phase))retired=true;
    };
    function emit(phase:HeadClientPhase,bytes?:HeadReadProgress){
      let current=started;
      try{const value=options.now?.()??Date.now();if(Number.isFinite(value))current=value;}catch{/* Keep previous elapsed time. */}
      lastElapsed=Math.max(lastElapsed,Math.min(HEAD_CLIENT_MAX_MS,Math.max(0,Math.trunc(current-started))));
      const event:HeadClientTraceEvent=bytes?
        {schema:1,attempt,phase,elapsedMs:lastElapsed,loadedBytes:bytes.loadedBytes,totalBytes:bytes.totalBytes}:
        {schema:1,attempt,phase,elapsedMs:lastElapsed};
      emitted++;
      try{options.write?.(HEAD_CLIENT_TRACE_PREFIX+JSON.stringify(event));}catch{/* Observer failure cannot affect a study. */}
    }
    emit('study-start');
    return trace;
  };
}

declare const __VM_LOCAL_HEAD_DIAGNOSTICS__:boolean;
let pageHeadDiagnosticsFactory:ReturnType<typeof createHeadClientDiagnostics>|undefined;

/** Local build and URL gates are checked on every call; no persisted setting. */
export function beginHeadStudyDiagnostics():HeadClientTrace|null{
  try{
    if(typeof __VM_LOCAL_HEAD_DIAGNOSTICS__==='undefined'||typeof window==='undefined'||
      !headClientDiagnosticsAllowed(__VM_LOCAL_HEAD_DIAGNOSTICS__,window.location.origin,window.location.hash))return null;
    if(!pageHeadDiagnosticsFactory){
      if(typeof window.console?.info!=='function')return null;
      pageHeadDiagnosticsFactory=createHeadClientDiagnostics({enabled:true,write:line=>window.console.info(line)});
    }
    return pageHeadDiagnosticsFactory();
  }catch{return null;}
}
