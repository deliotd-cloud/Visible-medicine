import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {CURRENT_ATLAS_REVISION,currentAtlasDeliveryRoot} from './current-atlas-delivery.mjs';

const websiteEpoch='c285a3871181565c35535ed65eb48d23fc13acd8';
const historicAtlas='a10496da94d9d054306bbc48e5ae9c98239d82b5';
const currentAtlas=CURRENT_ATLAS_REVISION;
const atlasRoot=currentAtlasDeliveryRoot();
const inputHashes={
  'lib/camera-keyboard.ts':'9a0a095306c6687ca7fd568570c7a66363566ac3a70f2916bc1e8f74aa405220',
  'app/camera-keyboard.css':'98d5bb8c7fe828c06e13f065fa7628aeeeb3638bedaea07a963ee3712ba4e7de',
};
const modules={
  shoulder:'706a265ce1f7ba47c441a52960c34cb9ed86dcd23b37125c594ef239ca7a4c30',
  'female-pelvis':'c481ea764e4d9ccb469d29507550cb8f72de966c3c9ef77acfa0b99b925e7815',
  'lower-limb':'dea24b3bc4ddd50d81d89524c600883896383ce9c2a76f8fd39f3e8f0aba909d',
  'head-neck':'0be7bbd67e7eba935ab05a66379e07efe0c970cecb247d54482f7187a99a0fae',
};
const sha=(bytes:Buffer|string)=>createHash('sha256').update(bytes).digest('hex');
const git=(root:string,revision:string,path:string)=>execFileSync('git',['-C',root,'show',`${revision}:${path}`],
  {env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1'},windowsHide:true,maxBuffer:32e6});
const historical=(path:string)=>git(process.cwd(),websiteEpoch,path);
type Input={path:string;sha256:string};
type File={path:string;sha256:string;bytes:number};

for(const [module,manifestHash] of Object.entries(modules)) test(`${module} preserves the source-verified keyboard camera and focus-only hint across saved and current exports`,()=>{
  const base=`public/atlas-runtime/${module}/`;
  const savedBytes=historical(base+'manifest.json');
  assert.equal(sha(savedBytes),manifestHash,'immutable a10496da manifest');
  const saved=JSON.parse(savedBytes.toString());
  assert.equal(saved.sourceCommit,historicAtlas);
  const savedInputs=JSON.parse(historical(base+'source-inputs.json').toString()) as Input[];
  for(const [path,hash] of Object.entries(inputHashes)){
    assert.equal(savedInputs.find(f=>f.path===path)?.sha256,hash,`historical ${path}`);
    assert.equal(sha(git(atlasRoot,historicAtlas,path)),hash,`historical source ${path}`);
  }
  const manifest=JSON.parse(readFileSync(base+'manifest.json','utf8'));
  assert.equal(manifest.sourceCommit,currentAtlas);
  assert.equal(manifest.patientDataIncluded,false);
  assert.equal(manifest.clinicalApproved,false);
  const inputs=JSON.parse(readFileSync(base+'source-inputs.json','utf8')) as Input[];
  const review=JSON.parse(readFileSync('atlas-review/manifest.json','utf8'));
  assert.equal(review.revision,currentAtlas);
  for(const [path,hash] of Object.entries(inputHashes)){
    const source=git(atlasRoot,currentAtlas,path);
    assert.equal(sha(source),hash,`current committed ${path}`);
    if(path.endsWith('.ts')){
      const rules=source.toString();
      assert.match(rules,/event\.target !== surface \|\| surface\.ownerDocument\.activeElement !== surface/,
        'keyboard controls consume keys only on the focused surface');
      assert.match(rules,/!controls\?\.enabled \|\| !controls\.enableRotate/,
        'disabled rotation cannot respond');
      assert.match(rules,/event\.preventDefault\(\); \/\/ Only the focused model consumes rotation arrows\./,
        'only an eligible arrow prevents default behavior');
    }else{
      assert.match(source.toString(),/canvas:is\(\[data-keyboard-rotation\], \[data-keyboard-pan\]\):focus-visible/,
        'focus-only keyboard hint styling');
    }
    assert.equal(inputs.find(f=>f.path===path)?.sha256,sha(source),`current ${path} input`);
    const imported=readFileSync(`atlas-review/${path}`);
    assert.equal(sha(imported),review.files.find((f:{path:string})=>f.path===path)?.importedSha256,`Review import ${path}`);
    assert.equal(review.files.find((f:{path:string})=>f.path===path)?.sourceSha256,sha(source),`Review source ${path}`);
  }
  const code=manifest.files.filter((f:File)=>f.path.endsWith('.js')).map((f:File)=>{
    const bytes=readFileSync(base+f.path);
    assert.equal(bytes.length,f.bytes,`${f.path} length`);
    assert.equal(sha(bytes),f.sha256,`${f.path} hash`);
    return bytes.toString();
  }).join('\n');
  assert.match(code,/Arrow keys rotate the view/);
  assert.match(code,/Arrow keys pan the tray/);
  const css=manifest.files.filter((f:File)=>f.path.endsWith('.css')).map((f:File)=>{
    const bytes=readFileSync(base+f.path);
    assert.equal(sha(bytes),f.sha256,`${f.path} hash`);
    return bytes.toString();
  }).join('\n');
  assert.match(css,/:focus-visible/);
  assert.match(css,/data-keyboard-rotation/);
});
