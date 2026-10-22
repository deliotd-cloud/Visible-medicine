import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import test from 'node:test';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot,validateCurrentAtlasDelivery} from './current-atlas-delivery.mjs';

// The saved website commit is the complete a10496da delivery epoch. Never
// compare that epoch's metadata with a later live export.
const websiteEpoch='c285a3871181565c35535ed65eb48d23fc13acd8';
const historicAtlas='a10496da94d9d054306bbc48e5ae9c98239d82b5';
const historicCameraSha='9d13fb2b2c498fff6fae7944b4f6ed95d4563dc9d0e1653eed0cb716aa6743a0';
const currentAtlas=CURRENT_ATLAS_REVISION;
const atlasRoot=currentAtlasDeliveryRoot();
const {transformSync}=createRequire(`${process.cwd()}/package.json`)('esbuild') as typeof import('esbuild');
const modules=['head-neck','shoulder','female-pelvis','lower-limb'] as const;
const sha=(bytes:Buffer|string)=>createHash('sha256').update(bytes).digest('hex');
const git=(root:string,revision:string,path:string)=>execFileSync('git',['-C',root,'show',`${revision}:${path}`],
  {env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'},windowsHide:true,maxBuffer:32e6});
const website=(path:string)=>git(process.cwd(),websiteEpoch,path);
const atlas=(revision:string,path:string)=>git(atlasRoot,revision,path);
const parse=(bytes:Buffer)=>JSON.parse(bytes.toString());
const cameraPath='app/fitted-camera.tsx';
type FileRow={path:string;sha256:string;bytes:number};
type InputRow={path:string;sha256:string};

function keyboardContract(source:string){
  const match=source.match(/return bindCameraKeyboard\(gl\.domElement, \(\) => controls\.current, \(\) => \{([\s\S]*?)\}\);/);
  assert.ok(match,'perspective keyboard binding');
  assert.match(match[1],/transition\.current = null;\s*capture\(\);\s*invalidate\(\);\s*if \(onKeyboardRotate && controls\.current\)/,
    'consumed keyboard rotation interrupts the guided sweep before capture and orientation notice');
  assert.match(source,/onStart=\{\(\) => \{ transition\.current = null; capture\(\); \}\}/,
    'pointer inspection also interrupts the sweep');
  assert.match(source,/onChange=\{capture\}/,'orbit changes capture without an extra keyboard notice');
}

// Current zoom-capable source supplies the actual camera as a fourth argument.
// Historical three-argument source retains its complete original contract.
function currentKeyboardContract(source:string){
  const pattern=/return bindCameraKeyboard\(gl\.domElement, \(\) => controls\.current, \(\) => \{([\s\S]*?)\}, camera\);/g;
  const matches=[...source.matchAll(pattern)];
  assert.equal(matches.length,1,'source190 perspective binding must supply its zoom camera');
  const call=matches[0][0];
  keyboardContract(source.replace(call,call.replace(/\}, camera\);$/,'});')));
}

function assertRuntimeFiles(manifest:{files:FileRow[]},read:(path:string)=>Buffer,label:string){
  assert.ok(manifest.files.length>0,`${label}: files listed`);
  for(const file of manifest.files){
    assert.ok(!file.path.includes('..')&&!file.path.startsWith('/'),`${label}: contained file path`);
    const bytes=read(file.path);
    assert.equal(bytes.length,file.bytes,`${label}/${file.path}: byte length`);
    assert.equal(sha(bytes),file.sha256,`${label}/${file.path}: SHA-256`);
  }
}

test('saved a10496da keyboard fix belongs to the whole immutable c285a387 website epoch',()=>{
  const review=parse(website('atlas-review/manifest.json'));
  assert.equal(review.revision,historicAtlas);
  const camera=review.files.find((file:{path:string})=>file.path===cameraPath);
  assert.ok(camera);
  const source=atlas(historicAtlas,cameraPath);
  assert.equal(sha(source),historicCameraSha,'original guided-camera source pin');
  assert.equal(sha(source),camera.sourceSha256);
  const imported=website(`atlas-review/${cameraPath}`);
  assert.equal(sha(imported),camera.importedSha256);
  keyboardContract(source.toString());
  keyboardContract(imported.toString());
  for(const name of modules){
    const base=`public/atlas-runtime/${name}/`;
    const manifest=parse(website(`${base}manifest.json`));
    const inputs=parse(website(`${base}source-inputs.json`)) as InputRow[];
    assert.equal(manifest.sourceCommit,historicAtlas,`${name}: saved source revision`);
    assert.equal(manifest.patientDataIncluded,false);
    assert.equal(manifest.clinicalApproved,false);
    assert.deepEqual(inputs.filter(input=>input.path===cameraPath),
      [{path:cameraPath,sha256:historicCameraSha}],`${name}: exact historical camera input`);
    assertRuntimeFiles(manifest,path=>website(`${base}${path}`),`saved ${name}`);
  }
});

test('current camera source, import, and four runtimes retain the keyboard transition',()=>{
  const pin=validateCurrentAtlasDelivery();assert.equal(pin.source,currentAtlas);
  const review=parse(readFileSync('atlas-review/manifest.json'));
  assert.equal(review.revision,currentAtlas);
  const camera=review.files.find((file:{path:string})=>file.path===cameraPath);
  assert.ok(camera);
  const source=atlas(currentAtlas,cameraPath);
  assert.equal(sha(source),camera.sourceSha256);
  const imported=readFileSync(`atlas-review/${cameraPath}`);
  assert.equal(sha(imported),camera.importedSha256);
  currentKeyboardContract(source.toString());
  currentKeyboardContract(imported.toString());
  assert.match(imported.toString(),/skipTransitionDelta\.current \|\| !Number\.isFinite\(delta\) \|\| delta <= 0/,
    'first, resumed, and invalid frame deltas cannot consume tour time');
  assert.match(imported.toString(),/motion\.elapsed \+= activeDelta \* 1000/,
    'valid active deltas preserve the selected tour speed');
  assert.match(imported.toString(),/if \(from && transitionMs > 0 && camera instanceof PerspectiveCamera && isPreset\)/,
    'zero-duration reduced-motion path does not start a transition');
  for(const name of modules){
    const base=`public/atlas-runtime/${name}/`;
    const manifest=parse(readFileSync(`${base}manifest.json`));
    const inputs=parse(readFileSync(`${base}source-inputs.json`)) as InputRow[];
    assert.equal(manifest.sourceCommit,pin.runtimeSources[name],`${name}: current source revision`);
    assert.equal(manifest.patientDataIncluded,false);
    assert.equal(manifest.clinicalApproved,false);
    assert.deepEqual(inputs.filter(input=>input.path===cameraPath),
      [{path:cameraPath,sha256:sha(atlas(pin.runtimeSources[name],cameraPath))}],`${name}: committed camera input`);
    assertRuntimeFiles(manifest,path=>readFileSync(`${base}${path}`),`current ${name}`);
  }
});

test('current committed keyboard helper rotates only a focused enabled camera and keeps damping',()=>{
  const path='lib/camera-keyboard.ts';
  const source=atlas(currentAtlas,path);
  const review=parse(readFileSync('atlas-review/manifest.json'));
  const file=review.files.find((row:{path:string})=>row.path===path);
  assert.ok(file);
  assert.equal(sha(source),file.sourceSha256);
  const imported=readFileSync(`atlas-review/${path}`);
  assert.equal(sha(imported),file.importedSha256);
  const compiled=transformSync(imported.toString(),{loader:'ts',format:'cjs'}).code;
  const module={exports:{} as {bindCameraKeyboard:Function}};
  runInNewContext(compiled,{module,exports:module.exports,require:createRequire(`${process.cwd()}/package.json`)});
  const attributes=new Map<string,string>();
  let handler:(event:any)=>void=()=>{throw Error('unbound')};
  const surface={ownerDocument:{activeElement:null as unknown},
    getAttribute:(key:string)=>attributes.get(key)??null,
    setAttribute:(key:string,value:string)=>attributes.set(key,value),
    removeAttribute:(key:string)=>attributes.delete(key),
    addEventListener:(_type:string,fn:typeof handler)=>{handler=fn;},
    removeEventListener:()=>{}};
  surface.ownerDocument.activeElement=surface;
  let azimuth=0,changes=0;
  const controls={enabled:true,enableRotate:true,enableDamping:true,
    minAzimuthAngle:-Infinity,maxAzimuthAngle:Infinity,minPolarAngle:0,maxPolarAngle:Math.PI,
    getAzimuthalAngle:()=>azimuth,getPolarAngle:()=>Math.PI/2,
    setAzimuthalAngle:(next:number)=>{assert.equal(controls.enableDamping,false);azimuth=next;},
    setPolarAngle:()=>{throw Error('unexpected polar rotation');}};
  const unbind=module.exports.bindCameraKeyboard(surface,()=>controls,()=>changes++);
  const event=(extra:Record<string,unknown>={})=>({key:'ArrowRight',target:surface,defaultPrevented:false,
    isComposing:false,altKey:false,ctrlKey:false,metaKey:false,shiftKey:false,
    preventDefault(){},stopPropagation(){},...extra});
  handler(event({target:{}}));assert.equal(changes,0,'unfocused input ignored');
  handler(event());assert.equal(changes,1);assert.ok(Math.abs(azimuth-10*Math.PI/180)<1e-12);
  assert.equal(controls.enableDamping,true,'damping restored after an immediate keyboard step');
  handler(event({shiftKey:true}));assert.equal(changes,2);
  assert.ok(Math.abs(azimuth-12*Math.PI/180)<1e-12,'Shift uses a fine two-degree step');
  controls.enableRotate=false;handler(event());assert.equal(changes,2,'locked camera ignores keys');
  unbind();
});

test('current camera contract rejects a missing zoom-camera argument without relaxing historical source',()=>{
  const source=atlas(currentAtlas,cameraPath).toString();
  const ending='    }, camera);';
  assert.equal(source.split(ending).length,2);
  assert.throws(()=>currentKeyboardContract(source.replace(ending,'    });')),
    /source190 perspective binding must supply its zoom camera/);
});
