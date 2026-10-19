import {gunzipSync} from 'node:zlib';

const MAX_HEADER=64*1024;
const MAX_DATA=256*1024*1024;
const MAX_VOXELS=134217728;
const SCALARS=new Map([
  ['uint8',['uint8',1]],['unsigned char',['uint8',1]],['uchar',['uint8',1]],
  ['int8',['int8',1]],['signed char',['int8',1]],['char',['int8',1]],
  ['uint16',['uint16',2]],['unsigned short',['uint16',2]],['ushort',['uint16',2]],
  ['int16',['int16',2]],['short',['int16',2]],['signed short',['int16',2]],
  ['uint32',['uint32',4]],['unsigned int',['uint32',4]],['uint',['uint32',4]],
  ['int32',['int32',4]],['int',['int32',4]],['signed int',['int32',4]],
  ['float32',['float32',4]],['float',['float32',4]],
  ['float64',['float64',8]],['double',['float64',8]],
]);
const ALLOWED=new Set(['type','dimension','sizes','encoding','endian','space','space dimension','space directions','space origin','kinds']);
const REQUIRED=['type','dimension','sizes','encoding','space','space directions','space origin'];
const NUMBER='[+-]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)(?:[eE][+-]?\\d+)?';
const VECTOR=new RegExp(`\\(\\s*(${NUMBER})\\s*,\\s*(${NUMBER})\\s*,\\s*(${NUMBER})\\s*\\)`,'y');
const fail=(reason)=>{throw new Error(`Unsupported scalar NRRD: ${reason}`);};

function inputBytes(bytes){
  if(bytes instanceof ArrayBuffer)return new Uint8Array(bytes);
  if(ArrayBuffer.isView(bytes)&&bytes.BYTES_PER_ELEMENT===1)return new Uint8Array(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  return fail('input must be a byte array.');
}

function splitHeader(bytes){
  if(bytes.byteLength<12||bytes.byteLength>MAX_DATA+MAX_HEADER)return fail('input size is outside bounds.');
  const limit=Math.min(bytes.byteLength,MAX_HEADER);
  let end=-1,separator=0;
  for(let i=0;i<limit-1;i++){
    if(bytes[i]===10&&bytes[i+1]===10){end=i;separator=2;break;}
    if(i+3<limit&&bytes[i]===13&&bytes[i+1]===10&&bytes[i+2]===13&&bytes[i+3]===10){end=i;separator=4;break;}
  }
  if(end<0)return fail('header terminator missing or header exceeds 64 KiB.');
  const header=bytes.subarray(0,end);
  for(const byte of header)if(!(byte===9||byte===10||byte===13||byte>=32&&byte<=126))return fail('header is not plain ASCII.');
  const lines=Buffer.from(header).toString('ascii').split(/\r?\n/);
  if(lines.some(line=>line.includes('\r')))return fail('mixed or malformed line endings.');
  return{lines,payload:bytes.subarray(end+separator)};
}

function fields(lines){
  if(!/^NRRD000[45]$/.test(lines[0]??''))return fail('version must be NRRD0004 or NRRD0005.');
  const parsed=new Map();
  for(const line of lines.slice(1)){
    if(line.startsWith('#'))continue;
    const match=/^([a-z][a-z ]*[a-z]|[a-z]):[ \t]+([^\s].*[^\s]|\S)$/i.exec(line);
    if(!match)return fail('malformed field.');
    const name=match[1].toLowerCase(),value=match[2];
    if(!ALLOWED.has(name))return fail(`unsupported field ${name}.`);
    if(parsed.has(name))return fail(`duplicate field ${name}.`);
    parsed.set(name,value);
  }
  for(const name of REQUIRED)if(!parsed.has(name))return fail(`missing ${name}.`);
  return parsed;
}

function parseVector(text){
  VECTOR.lastIndex=0;const match=VECTOR.exec(text);
  if(!match)return fail('invalid spatial vector.');
  const values=match.slice(1).map(Number);
  if(values.some(value=>!Number.isFinite(value)||Math.abs(value)>100000))return fail('nonfinite or out-of-bounds spatial coordinate.');
  return{values,end:VECTOR.lastIndex};
}

function geometry(parsed){
  const space=parsed.get('space').toLowerCase();
  const lps=space==='lps'||space==='left-posterior-superior';
  if(!lps&&space!=='ras'&&space!=='right-anterior-superior')return fail('space must explicitly be RAS or LPS.');
  if(parsed.has('space dimension')&&parsed.get('space dimension')!=='3')return fail('space dimension must be 3.');
  const directionText=parsed.get('space directions');
  const columns=[];let cursor=0;
  for(let axis=0;axis<3;axis++){
    if(axis){const gap=/^[ \t]+/.exec(directionText.slice(cursor));if(!gap)return fail('expected three spatial direction vectors.');cursor+=gap[0].length;}
    const vector=parseVector(directionText.slice(cursor));columns.push(vector.values);cursor+=vector.end;
  }
  if(cursor!==directionText.length)return fail('extra or nonspatial direction axis.');
  const origin=parseVector(parsed.get('space origin'));
  if(origin.end!==parsed.get('space origin').length)return fail('invalid spatial origin.');
  const signs=lps?[-1,-1,1]:[1,1,1];
  const rasColumns=columns.map(column=>column.map((value,i)=>value*signs[i]));
  const rasOrigin=origin.values.map((value,i)=>value*signs[i]);
  const lengths=rasColumns.map(column=>Math.hypot(...column));
  if(lengths.some(length=>!Number.isFinite(length)||length<=1e-9))return fail('zero or invalid spatial axis.');
  const unit=rasColumns.map((column,i)=>column.map(value=>value/lengths[i]));
  const dot=(a,b)=>a.reduce((sum,value,i)=>sum+value*b[i],0);
  for(let a=0;a<3;a++)for(let b=a+1;b<3;b++)if(Math.abs(dot(unit[a],unit[b]))>1e-4)return fail('sheared spatial grid.');
  const cross=[unit[1][1]*unit[2][2]-unit[1][2]*unit[2][1],unit[1][2]*unit[2][0]-unit[1][0]*unit[2][2],unit[1][0]*unit[2][1]-unit[1][1]*unit[2][0]];
  if(!Number.isFinite(dot(unit[0],cross))||Math.abs(dot(unit[0],cross))<1e-6)return fail('singular spatial grid.');
  return [[...rasColumns.map(column=>column[0]),rasOrigin[0]],
    [...rasColumns.map(column=>column[1]),rasOrigin[1]],
    [...rasColumns.map(column=>column[2]),rasOrigin[2]],[0,0,0,1]];
}

function scalarData(bytes,dtype,bytesPer,endian){
  const data=Uint8Array.from(bytes);
  if(bytesPer>1&&endian==='big')for(let offset=0;offset<data.length;offset+=bytesPer)
    for(let i=0;i<bytesPer/2;i++){const opposite=offset+bytesPer-1-i,first=offset+i;[data[first],data[opposite]]=[data[opposite],data[first]];}
  if(dtype==='float32'||dtype==='float64'){
    const view=new DataView(data.buffer,data.byteOffset,data.byteLength);
    for(let offset=0;offset<data.length;offset+=bytesPer){
      const value=dtype==='float32'?view.getFloat32(offset,true):view.getFloat64(offset,true);
      if(!Number.isFinite(value))return fail('nonfinite scalar value.');
    }
  }
  return data;
}

/** Exact scalar bytes only; no detached files, resampling, source execution or private-data persistence. */
export function decodeScalarNrrd(bytes){
  const source=inputBytes(bytes),{lines,payload}=splitHeader(source),parsed=fields(lines);
  if(parsed.get('dimension')!=='3')return fail('dimension must be exactly 3.');
  const sizes=parsed.get('sizes').split(/[ \t]+/);
  if(sizes.length!==3||sizes.some(value=>!/^[1-9]\d*$/.test(value)))return fail('three positive scalar sizes required.');
  const dims=sizes.map(Number);
  if(dims.some(value=>!Number.isSafeInteger(value)||value>4096))return fail('dimension exceeds 4096.');
  const voxels=dims.reduce((total,size)=>total*size,1);
  if(voxels>MAX_VOXELS)return fail('voxel count exceeds the limit.');
  if(parsed.has('kinds')&&!/^(?:domain|space)(?:[ \t]+(?:domain|space)){2}$/i.test(parsed.get('kinds')))
    return fail('list, vector, time or other nonspatial axis.');
  const scalar=SCALARS.get(parsed.get('type').toLowerCase().replace(/[ \t]+/g,' '));
  if(!scalar)return fail('unsupported scalar type.');
  const [dtype,bytesPer]=scalar,expected=voxels*bytesPer;
  if(expected>MAX_DATA)return fail('scalar data exceeds 256 MiB.');
  const endian=parsed.get('endian')?.toLowerCase();
  if(endian!==undefined&&endian!=='little'&&endian!=='big'||bytesPer>1&&endian===undefined)return fail('explicit little or big endian required.');
  const affine=geometry(parsed);
  const encoding=parsed.get('encoding').toLowerCase();
  let decoded;
  if(encoding==='raw')decoded=payload;
  else if(encoding==='gzip'||encoding==='gz'){
    try{decoded=gunzipSync(payload,{maxOutputLength:expected});}
    catch{return fail('gzip decompression failed or exceeded the declared byte count.');}
  }else return fail('only raw or gzip encoding is supported.');
  if(decoded.byteLength!==expected)return fail('scalar data byte count mismatch.');
  return{dtype,shape_kji:[dims[2],dims[1],dims[0]],ijk_to_ras:affine,data:scalarData(decoded,dtype,bytesPer,endian)};
}
