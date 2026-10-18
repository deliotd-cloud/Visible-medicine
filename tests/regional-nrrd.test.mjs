import assert from 'node:assert/strict';
import test from 'node:test';
import {gzipSync} from 'node:zlib';
import {decodeScalarNrrd} from '../scripts/regional-nrrd.mjs';

const TYPES={uint8:1,int8:1,uint16:2,int16:2,uint32:4,int32:4,float32:4,float64:8};
const DEFAULT={type:'uint16',dimension:'3',sizes:'2 3 2',encoding:'raw',endian:'little',space:'right-anterior-superior',
  'space directions':'(1,0,0) (0,2,0) (0,0,3)','space origin':'(4,5,6)',kinds:'domain domain domain'};
function nrrd(payload,changes={},version='NRRD0005',lineEnding='\n'){
  const fields={...DEFAULT,...changes};
  const lines=[version,...Object.entries(fields).filter(([,value])=>value!==null).map(([key,value])=>`${key}: ${value}`)];
  return Buffer.concat([Buffer.from(lines.join(lineEnding)+lineEnding+lineEnding,'ascii'),Buffer.from(payload)]);
}
function scalarBytes(dtype,values,endian='little'){
  const bytes=new Uint8Array(values.length*TYPES[dtype]),view=new DataView(bytes.buffer),little=endian==='little';
  values.forEach((value,i)=>{const at=i*TYPES[dtype];switch(dtype){
    case'uint8':view.setUint8(at,value);break;case'int8':view.setInt8(at,value);break;
    case'uint16':view.setUint16(at,value,little);break;case'int16':view.setInt16(at,value,little);break;
    case'uint32':view.setUint32(at,value,little);break;case'int32':view.setInt32(at,value,little);break;
    case'float32':view.setFloat32(at,value,little);break;case'float64':view.setFloat64(at,value,little);break;
  }});return bytes;
}
const samples={uint8:[0,1,254,255],int8:[-128,-1,0,127],uint16:[0,1,32769,65535],int16:[-32768,-1,0,32767],
  uint32:[0,1,2147483649,4294967295],int32:[-2147483648,-1,0,2147483647],float32:[-0,1.25,-1024.5,3.5],float64:[-0,1.25,-1024.5,3.5]};

for(const dtype of Object.keys(TYPES))for(const encoding of ['raw','gzip'])for(const endian of ['little','big']){
  test(`${dtype} ${encoding} ${endian} preserves exact scalar bytes in I-fastest KJI`,()=>{
    const values=samples[dtype],stored=scalarBytes(dtype,values,endian),expected=scalarBytes(dtype,values,'little');
    const data=encoding==='gzip'?gzipSync(stored):stored;
    const source=nrrd(data,{type:dtype,sizes:'2 2 1',encoding,endian},'NRRD0004');
    const original=Buffer.from(source),result=decodeScalarNrrd(source);
    assert.deepEqual(result.shape_kji,[1,2,2]);assert.equal(result.dtype,dtype);
    assert.deepEqual([...result.data],[...expected]);assert.deepEqual(source,original,'input cannot be swapped in place');
    assert.deepEqual(result.ijk_to_ras,[[1,0,0,4],[0,2,0,5],[0,0,3,6],[0,0,0,1]]);
    assert.deepEqual(Object.keys(result),['dtype','shape_kji','ijk_to_ras','data']);
  });
}

test('LPS asymmetric permuted oblique columns and origin convert exactly to RAS',()=>{
  const cosine=Math.cos(Math.PI/6),sine=Math.sin(Math.PI/6);
  const directions=`(0,${2*cosine},${2*sine}) (0,${-3*sine},${3*cosine}) (-4,0,0)`;
  const source=nrrd(new Uint8Array(12),{type:'uint8',sizes:'2 3 2',endian:null,space:'left-posterior-superior',
    'space directions':directions,'space origin':'(10,-20,30)'},'NRRD0005','\r\n');
  const result=decodeScalarNrrd(source);
  assert.deepEqual(result.shape_kji,[2,3,2]);
  const expected=[[0,0,4,-10],[-2*cosine,3*sine,0,20],[2*sine,3*cosine,0,30],[0,0,0,1]];
  result.ijk_to_ras.forEach((row,i)=>row.forEach((value,j)=>assert.ok(Math.abs(value-expected[i][j])<1e-12,`${i},${j}`)));
});

test('single-byte scalar may omit endian; source view offset is honored',()=>{
  const source=nrrd(new Uint8Array([1,2,3,4]),{type:'unsigned char',sizes:'2 2 1',endian:null});
  const wrapped=Buffer.concat([Buffer.from([91,92]),source,Buffer.from([93])]);
  const view=wrapped.subarray(2,-1),result=decodeScalarNrrd(view);
  assert.deepEqual([...result.data],[1,2,3,4]);assert.deepEqual(wrapped.subarray(0,2),Buffer.from([91,92]));
});

const invalid=[
  ['old version',()=>nrrd(new Uint8Array(24),{},'NRRD0003')],
  ['detached',()=>nrrd(new Uint8Array(24),{'data file':'image.raw'})],
  ['ascii encoding',()=>nrrd(Buffer.from('1 2 3'),{encoding:'ascii'})],
  ['unsupported space',()=>nrrd(new Uint8Array(24),{space:'left-anterior-superior'})],
  ['missing space',()=>nrrd(new Uint8Array(24),{space:null})],
  ['list axis',()=>nrrd(new Uint8Array(24),{kinds:'list domain domain'})],
  ['vector axis',()=>nrrd(new Uint8Array(24),{kinds:'vector domain domain'})],
  ['time axis',()=>nrrd(new Uint8Array(24),{kinds:'time domain domain'})],
  ['none direction',()=>nrrd(new Uint8Array(24),{'space directions':'none (0,2,0) (0,0,3)'})],
  ['dimension four',()=>nrrd(new Uint8Array(24),{dimension:'4'})],
  ['four sizes',()=>nrrd(new Uint8Array(24),{sizes:'2 3 2 1'})],
  ['zero size',()=>nrrd(new Uint8Array(24),{sizes:'2 0 2'})],
  ['per-axis limit',()=>nrrd(new Uint8Array(24),{sizes:'4097 1 1'})],
  ['voxel limit',()=>nrrd(new Uint8Array(1),{sizes:'4096 4096 9',type:'uint8'})],
  ['data limit',()=>nrrd(new Uint8Array(1),{sizes:'4096 4096 3',type:'float64'})],
  ['missing endian',()=>nrrd(new Uint8Array(24),{endian:null})],
  ['unknown endian',()=>nrrd(new Uint8Array(24),{endian:'middle'})],
  ['unsupported type',()=>nrrd(new Uint8Array(24),{type:'block'})],
  ['raw too short',()=>nrrd(new Uint8Array(23))],
  ['raw too long',()=>nrrd(new Uint8Array(25))],
  ['gzip too short',()=>nrrd(gzipSync(new Uint8Array(23)),{encoding:'gzip'})],
  ['gzip expansion beyond declared',()=>nrrd(gzipSync(new Uint8Array(25)),{encoding:'gzip'})],
  ['invalid gzip',()=>nrrd(new Uint8Array([1,2,3]),{encoding:'gzip'})],
  ['zero vector',()=>nrrd(new Uint8Array(24),{'space directions':'(0,0,0) (0,2,0) (0,0,3)'})],
  ['sheared vector',()=>nrrd(new Uint8Array(24),{'space directions':'(1,0,0) (1,2,0) (0,0,3)'})],
  ['singular vectors',()=>nrrd(new Uint8Array(24),{'space directions':'(1,0,0) (2,0,0) (0,0,3)'})],
  ['nonfinite direction',()=>nrrd(new Uint8Array(24),{'space directions':'(NaN,0,0) (0,2,0) (0,0,3)'})],
  ['nonfinite origin',()=>nrrd(new Uint8Array(24),{'space origin':'(0,Infinity,0)'})],
  ['extra direction',()=>nrrd(new Uint8Array(24),{'space directions':'(1,0,0) (0,2,0) (0,0,3) none'})],
  ['bad space dimension',()=>nrrd(new Uint8Array(24),{'space dimension':'4'})],
  ['mixed header endings',()=>Buffer.from(nrrd(new Uint8Array(24))).subarray(0).map((byte,i)=>i===8?13:byte)],
];
for(const[label,make]of invalid)test(`rejects ${label}`,()=>assert.throws(()=>decodeScalarNrrd(make()),/Unsupported scalar NRRD/));

test('duplicate case-insensitive field and ambiguous whitespace fail',()=>{
  const good=nrrd(new Uint8Array(24));
  const duplicate=Buffer.concat([Buffer.from('NRRD0005\ntype: uint16\nTYPE: uint16\n'),good.subarray('NRRD0005\n'.length)]);
  assert.throws(()=>decodeScalarNrrd(duplicate),/duplicate field/);
  const trailing=Buffer.from(good.toString('latin1').replace('dimension: 3\n','dimension: 3 \n'),'latin1');
  assert.throws(()=>decodeScalarNrrd(trailing),/malformed field/);
  const extended=Buffer.from(good.toString('latin1').replace('dimension: 3\n','dimension:=3\n'),'latin1');
  assert.throws(()=>decodeScalarNrrd(extended),/malformed field/);
});

test('nonfinite float payloads and excessive header fail without altering input',()=>{
  for(const dtype of ['float32','float64']){
    const payload=scalarBytes(dtype,[0,1,Infinity,3,4,5,6,7,8,9,10,11]);
    const source=nrrd(payload,{type:dtype});const original=Buffer.from(source);
    assert.throws(()=>decodeScalarNrrd(source),/nonfinite scalar/);assert.deepEqual(source,original);
  }
  const oversized=Buffer.from(`NRRD0005\n#${'x'.repeat(65536)}\n\n`,'ascii');
  assert.throws(()=>decodeScalarNrrd(oversized),/header exceeds 64 KiB/);
});
