// Read-only, supplied-row check. Never opens D1, repairs data or authorizes access.
import {createHash} from 'node:crypto';

const columns=['id','sequence','actor_id','action','target_type','target_id','outcome','reason','occurred_at','integrity_hash'];
const eventColumns=['actor_id','action','target_type','target_id','outcome','reason','occurred_at'];
const hex=/^[a-f0-9]{64}$/;
const encoder=new TextEncoder();
const maximumRows=100_000;
const maximumBytes=64*1024*1024;

// Encode bounded chunks without constructing/encoding a whole large preimage.
// Do not split a surrogate pair: each chunk must match the original UTF-8 input.
function utf8Chunks(text,consume){
  for(let start=0;start<text.length;){
    let end=Math.min(start+4096,text.length);
    if(end<text.length && text.charCodeAt(end-1)>=0xd800 && text.charCodeAt(end-1)<=0xdbff && text.charCodeAt(end)>=0xdc00 && text.charCodeAt(end)<=0xdfff)end--;
    if(!consume(encoder.encode(text.slice(start,end))))return false;
    start=end;
  }
  return true;
}

function snapshot(record){
  if(!record || typeof record!=='object' || Array.isArray(record))return null;
  const proto=Object.getPrototypeOf(record);
  if(proto!==null && proto!==Object.prototype)return null;
  const copy={};
  for(const key of columns){
    const descriptor=Object.getOwnPropertyDescriptor(record,key);
    if(!descriptor || !Object.hasOwn(descriptor,'value'))return null;
    copy[key]=descriptor.value;
  }
  return copy;
}

function validExpectedHead(head){
  if(!head || typeof head!=='object' || Array.isArray(head))return false;
  const descriptors=Object.getOwnPropertyDescriptors(head);
  if(Object.keys(descriptors).length!==3 || ['rows','sequence','integrityHash'].some(k=>!Object.hasOwn(descriptors[k]??{},'value')))return false;
  return Number.isSafeInteger(head.rows) && head.rows>=0 && head.rows<=maximumRows && head.sequence===head.rows &&
    (head.rows===0 ? head.integrityHash===null : typeof head.integrityHash==='string' && hex.test(head.integrityHash));
}

/** The exact current db/bootstrap.ts appendAudit preimage, not a new format. */
export function auditHashInput(previousHash, row){
  return `${previousHash}|${row.sequence}|${row.actor_id}|${row.action}|${row.target_type}|${row.target_id}|${row.outcome}|${row.reason}|${row.occurred_at}`;
}

/**
 * Check an ascending, complete supplied stream from sequence 1, including an empty
 * stream. An optional independently captured head detects a missing/changed tail.
 * Input origin, snapshot completeness and authenticity are NOT established here.
 * A consistent chain can be forged by rewriting it; IDs are outside its digest.
 */
export async function inspectAuditChain(rows,{maxRows=maximumRows,maxBytes=maximumBytes,expectedHead}={}){
  if(!Number.isSafeInteger(maxRows) || maxRows<1 || maxRows>maximumRows ||
     !Number.isSafeInteger(maxBytes) || maxBytes<1 || maxBytes>maximumBytes)
    throw new TypeError('Invalid bounded audit-check limits');
  let boundary;
  try{
    if(expectedHead!==undefined && !validExpectedHead(expectedHead))throw new TypeError();
    // Copy the primitive boundary before yielding to an asynchronous source.
    boundary=expectedHead===undefined?null:{...expectedHead};
  }catch{throw new TypeError('Invalid audit head boundary');}
  let checkedRows=0,bytes=0,previousHash='GENESIS';
  const ids=new Set();
  const report=(failure=null)=>({
    format:'bootstrap-pipe-sha256-v1',scope:'supplied-rows',
    integrity:failure?'refused':'consistent',checkedRows,encodedBytes:bytes,
    head:{sequence:checkedRows,integrityHash:checkedRows?previousHash:null},
    snapshotMatches:boundary===null?null:failure===null,
    failure,completeness:'not-established',authenticity:'not-established',readyForProduction:false,
  });
  const refuse=code=>report({code,rowNumber:checkedRows+1});
  let iterable;
  try{iterable=rows && (typeof rows[Symbol.iterator]==='function' || typeof rows[Symbol.asyncIterator]==='function');}
  catch{return refuse('SOURCE_FAILURE');}
  if(!iterable)throw new TypeError('An ascending audit-row iterable is required');
  try{
    for await(const input of rows){
      if(checkedRows>=maxRows)return refuse('ROW_LIMIT');
      const row=snapshot(input);
      if(!row)return refuse('ROW_SHAPE');
      if(typeof row.id!=='string' || row.id.length===0 || eventColumns.some(k=>typeof row[k]!=='string'))return refuse('FIELD_TYPE');
      if(!Number.isSafeInteger(row.sequence) || row.sequence<1)return refuse('SEQUENCE_TYPE');
      if(row.sequence!==checkedRows+1)return refuse('SEQUENCE_ORDER');
      if(ids.has(row.id))return refuse('DUPLICATE_ID');
      if(typeof row.integrity_hash!=='string' || !hex.test(row.integrity_hash))return refuse('HASH_SHAPE');
      let rowBytes=0;
      const digest=createHash('sha256');
      const count=buffer=>{
        if(buffer.byteLength>maxBytes-bytes-rowBytes)return false;
        rowBytes+=buffer.byteLength;return true;
      };
      // Count the unhashed primary key and stored hash without allocating a
      // full input copy, then hash the original fields with literal separators.
      if(!utf8Chunks(row.id,count) || !utf8Chunks(row.integrity_hash,count))return refuse('BYTE_LIMIT');
      const parts=[previousHash,String(row.sequence),...eventColumns.map(k=>row[k])];
      let bounded=true;
      for(let part=0;part<parts.length;part++){
        if(part && !utf8Chunks('|',buffer=>{if(!count(buffer))return false;digest.update(buffer);return true;})){bounded=false;break;}
        if(!utf8Chunks(parts[part],buffer=>{if(!count(buffer))return false;digest.update(buffer);return true;})){bounded=false;break;}
      }
      if(!bounded)return refuse('BYTE_LIMIT');
      if(digest.digest('hex')!==row.integrity_hash)return refuse('HASH_MISMATCH');
      checkedRows++;bytes+=rowBytes;ids.add(row.id);previousHash=row.integrity_hash;
    }
  }catch{
    // Never forward source exceptions, SQL, identifiers or field contents.
    return refuse('SOURCE_FAILURE');
  }
  if(boundary && (boundary.rows!==checkedRows || boundary.sequence!==checkedRows || boundary.integrityHash!==(checkedRows?previousHash:null)))
    return refuse('HEAD_BOUNDARY_MISMATCH');
  return report();
}
