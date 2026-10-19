import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

// Reuse the original viewer harness without rewriting it. Use real owned guide
// and package APIs; canvas/React adapters are synthetic, not browser acceptance.
const websiteUrl=new URL('../',import.meta.url);
const websiteRequire=createRequire(new URL('package.json',websiteUrl));
const ts=websiteRequire('typescript') as typeof import('typescript');
const {build}=websiteRequire('esbuild') as typeof import('esbuild');
const originalTestUrl=new URL('tests/regional-mri-review-viewer.test.ts',websiteUrl);
const original=readFileSync(originalTestUrl,'utf8');
const firstTest=original.indexOf("\ntest('missing or malformed trusted source");
assert(firstTest>0,'Original viewer harness first-test boundary changed');
let prefix=original.slice(original.indexOf('const source='),firstTest).replaceAll('import.meta.url','fileUrl');
const oldGuided="'../lib/regional-mri-guided-study':{regionalMriGuides:syntheticGuides,regionalMriGuideAnnotation:syntheticGuideAnnotation}";
assert(prefix.includes(oldGuided),'Original guide dependency changed');
prefix=prefix.replace(oldGuided,"'../lib/regional-mri-guided-study':realGuidedApi");
const oldFocus="regionalMriFocusSlice:(_study:any,loaded:any,plane:string)=>loaded?.syntheticNoFocus?null:loaded?.annotation?.id==='ACL accepted'?(plane==='sagittal'?4:2):1,";
assert(prefix.includes(oldFocus),'Original native-focus dependency changed');
prefix=prefix.replace(oldFocus,'regionalMriFocusSlice:realGuidedApi.regionalMriFocusSlice,');

const apiPromise=build({stdin:{contents:[
  "export * from './lib/regional-mri-package';",
  "export * from './lib/regional-mri-guided-study';",
  "export {regionalMriFocusSlice} from './lib/regional-mri-render';",
].join('\n'),resolveDir:fileURLToPath(websiteUrl),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'}).then((result:any)=>
  import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].contents).toString('base64')));
const sha=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex');
const asset=(bytes:ArrayBuffer)=>({size:bytes.byteLength,async arrayBuffer(){return bytes.slice(0)}});
const popliteus='anat.knee.msk.popliteus_muscle',artery='anat.knee.nvs.popliteal_artery',vein='anat.knee.nvs.popliteal_vein';

async function fixture(){
  const api=await apiPromise,imageA=Uint8Array.from({length:27},(_,i)=>i+1).buffer,
    imageB=Uint8Array.from({length:27},(_,i)=>i+30).buffer;
  const hashA=sha(new Uint8Array(imageA)),hashB=sha(new Uint8Array(imageB));
  const grid={shape_kji:[3,3,3],ijk_to_ras:[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]};
  const annotation=(id:string,anatomyId:string,seriesId:string,imageSha256:string,
    status:'accepted-scoped'|'provisional'|'deferred'='accepted-scoped',kind:'points'|'none'='points')=>({
    id,anatomyId,label:id,seriesId,sourceImageSha256:imageSha256,laterality:'left',coverage:'partial',
    review:{status,revision:'c'.repeat(64),scope:'Synthetic current sequence only'},
    geometry:kind==='none'?{kind:'none'}:{kind:'points',points_ras_mm:[[1,2,1]]},
  });
  const a=(id:string,concept:string,status:'accepted-scoped'|'provisional'|'deferred'='accepted-scoped',kind:'points'|'none'='points')=>
    annotation(id,concept,'native',hashA,status,kind);
  const manifest={schema:'visible-medicine.regional-mri/1',version:'1.0.0',byteOrder:'little',region:'knee',laterality:'left',
    coordinateSystem:'per-series-RAS-mm',registration:'none',release:'local-private-draft',series:[
      {id:'native',label:'Synthetic native knee',image:{...grid,file:'native.raw',sha256:hashA,dtype:'uint8'},annotations:[
        a('popliteus-a',popliteus),a('popliteus-b',popliteus),
        a('artery-provisional',artery,'provisional'),a('artery-deferred',artery,'deferred','none'),
        a('artery-no-geometry',artery,'accepted-scoped','none'),a('vein-accepted',vein),
      ]},
      {id:'other',label:'Synthetic other knee',image:{...grid,file:'other.raw',sha256:hashB,dtype:'uint8'},annotations:[
        annotation('artery-other',artery,'other',hashB),
      ]},
    ]};
  const bytes=new TextEncoder().encode(JSON.stringify(manifest)).buffer as ArrayBuffer,revision=sha(new Uint8Array(bytes));
  const pkg=await api.openRegionalMriPackage(bytes,new Map([['manifest.json',asset(bytes)],['native.raw',asset(imageA)],['other.raw',asset(imageB)]]),revision);
  const study=await api.loadRegionalMriSeries(pkg,'native'),other=await api.loadRegionalMriSeries(pkg,'other');
  const guide=api.regionalMriGuides(pkg,study)[4];assert.equal(guide.id,'posterior-knee');
  const pin={revision,region:'knee',label:'Synthetic knee source'};
  const compiled=ts.transpileModule(prefix,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const helper=new Function('readFileSync','ts','fileUrl','realGuidedApi','assert',
    `${compiled}\nreturn {harness,flush,nodes,words};`)(readFileSync,ts,originalTestUrl,api,assert);
  const render=(h:any)=>h.render(pin);
  const load=async(h:any)=>{
    render(h);h.folder();h.opens[0].resolve(pkg);await helper.flush();render(h);h.select('native');
    h.seriesLoads[0].resolve(study);await helper.flush();render(h);
  };
  const loaded=async(candidate:any)=>api.loadRegionalMriAnnotation(pkg,study,candidate);
  return {api,pkg,study,other,guide,pin,helper,render,load,loaded};
}

test('real posterior guide appears as fifth collapsed path; explicit popliteus choice owns 3D disclosure',async()=>{
  const f=await fixture(),{harness,nodes,words,flush}=f.helper;
  const comparison={learning:{},provisional:false,atlasRevision:'a'.repeat(40),mappingRevision:'b'.repeat(64),targets:[
    {id:'synthetic-reference',label:'Synthetic same-side reference',kind:'body',side:'left',oppositeSide:false,
      region:'leg',relation:'same-structure',sourceHash:'d'.repeat(64),specimenRevision:null,href:'/atlas/3d?synthetic=1'},
  ]};
  const h=harness(comparison,null,()=>true,null,null,true);
  try{await f.load(h);
    for(const title of ['Cruciate ligaments','Collateral ligaments','Menisci','Extensor mechanism','Posterior knee: popliteus and vessels'])assert(h.button(title));
    assert.equal(h.find('details',(node:any)=>words(node).includes('Guided learning')).props.open,undefined);
    h.button('Posterior knee: popliteus and vessels').props.onClick();f.render(h);
    assert.match(words(h.tree()),/Multiple source variants/);assert.equal(h.annotationCalls.length,0);
    assert.equal(nodes(h.tree()).filter((node:any)=>node.type==='button'&&words(node)==='Show this step’s 3D reference options').length,0);
    h.button('Inspect popliteus-b in this sequence').props.onClick();assert.strictEqual(h.annotationCalls[0].annotation,f.study.series.annotations[1]);
    f.render(h);const overlay=await f.loaded(f.study.series.annotations[1]);h.annotationLoads[0].resolve(overlay);await flush();f.render(h);
    assert.strictEqual(h.frameCalls.at(-1)[1].annotation,overlay.annotation);
    assert(h.button('Show this step’s 3D reference options'));
    const reference=h.find('details',(node:any)=>words(node).startsWith('Compare in 3D'));
    assert(reference);assert.match(words(reference),/Synthetic same-side reference/);
    let focused=0;const element={open:false,querySelector:()=>({focus(){focused++;}})};reference.props.ref.current=element;
    const reveal=h.button('Show this step’s 3D reference options').props.onClick;reveal();
    assert.equal(element.open,true);assert.equal(focused,1);
    h.button('Inspect Synthetic same-side reference beside MRI').props.onClick({currentTarget:{focus(){}}});f.render(h);
    assert.equal(h.find('test-inline-inspection').props.inspection.target.id,'synthetic-reference');
    h.button('Next step').props.onClick();f.render(h);reveal();
    assert.equal(focused,1,'Retired posterior disclosure callback cannot reopen reference options');
    assert.equal(nodes(h.tree()).filter((node:any)=>node.type==='test-inline-inspection').length,0,'Unavailable artery retires the mounted reference');
    assert.equal(h.frameCalls.at(-1)[1],null,'Unavailable artery retires prior native geometry');
    assert.equal(f.pkg.manifest.registration,'none');
  }finally{h.cleanup();}
});

test('unavailable artery clears geometry and reference, while vein focuses in the committed native plane',async()=>{
  const f=await fixture(),{harness,nodes,words,flush}=f.helper,h=harness(null,null,()=>true,null,null,true);
  try{await f.load(h);h.button('Posterior knee: popliteus and vessels').props.onClick();f.render(h);
    h.button('Inspect popliteus-a in this sequence').props.onClick();f.render(h);
    h.annotationLoads[0].resolve(await f.loaded(f.study.series.annotations[0]));await flush();f.render(h);
    h.button('Next step').props.onClick();f.render(h);
    assert.match(words(h.tree()),/Popliteal artery/);assert.equal(h.frameCalls.at(-1)[1],null);
    assert.equal(h.annotationCalls.length,1,'Provisional/deferred/empty artery and other-sequence artery stay unavailable');
    for(const id of ['artery-provisional','artery-deferred','artery-no-geometry'])assert.equal(h.button(`Inspect ${id} in this sequence`).props.disabled,true);
    assert.doesNotMatch(words(h.tree()),/Inspect artery-other in this sequence/);
    assert.equal(nodes(h.tree()).filter((node:any)=>node.type==='test-inline-inspection').length,0);
    assert.equal(nodes(h.tree()).filter((node:any)=>node.type==='button'&&words(node)==='Show this step’s 3D reference options').length,0);
    h.button('Next step').props.onClick();f.render(h);assert.equal(h.annotationCalls.length,2);
    assert.strictEqual(h.annotationCalls[1].annotation,f.study.series.annotations[5]);
    h.button('sagittal').props.onClick();f.render(h);
    const overlay=await f.loaded(f.study.series.annotations[5]);h.annotationLoads[1].resolve(overlay);await flush();f.render(h);
    const expected=f.api.regionalMriFocusSlice(f.study,overlay,'sagittal');
    assert.equal(h.frameCalls.at(-1)[2],'sagittal');assert.equal(h.frameCalls.at(-1)[3],expected);
    assert.equal(h.find('input',(node:any)=>node.props['aria-label']==='Native slice').props.value,expected);
  }finally{h.cleanup();}
});

test('dirty correction refuses a posterior move; retired source and practice remove current guide controls',async()=>{
  const f=await fixture(),{harness,nodes,words,flush}=f.helper;let prompts=0;
  const h=harness(null,'b'.repeat(64),()=>{prompts++;return false;},()=>({}),null,true);
  try{await f.load(h);h.button('Posterior knee: popliteus and vessels').props.onClick();f.render(h);
    h.button('Inspect popliteus-a in this sequence').props.onClick();f.render(h);
    h.annotationLoads[0].resolve(await f.loaded(f.study.series.annotations[0]));await flush();f.render(h);
    h.find('test-correction-panel').props.onDirtyChange(true);f.render(h);
    h.button('Next step').props.onClick();f.render(h);assert.equal(prompts,1);
    assert.match(words(h.tree()),/Popliteus/);assert.strictEqual(h.frameCalls.at(-1)[1].annotation,f.study.series.annotations[0]);
    const replacement={...f.pin,revision:'f'.repeat(64),label:'Replacement source'};h.render(replacement);
    assert.equal(h.find('test-correction-panel').props.sourceRetired,true);
    assert.equal(h.button('Posterior knee: popliteus and vessels').props.disabled,true);
  }finally{h.cleanup();}
  const practice=harness(null,null,()=>true,()=>({}),null,true);
  try{await f.load(practice);practice.button('Posterior knee: popliteus and vessels').props.onClick();f.render(practice);
    practice.button('Inspect popliteus-a in this sequence').props.onClick();f.render(practice);
    practice.annotationLoads[0].resolve(await f.loaded(f.study.series.annotations[0]));await flush();f.render(practice);
    practice.button('Try structure check').props.onClick();f.render(practice);
    assert.equal(nodes(practice.tree()).filter((node:any)=>node.props['aria-label']==='Current guided inspection step').length,0);
    assert.equal(nodes(practice.tree()).filter((node:any)=>node.props['aria-label']==='Choose a knee inspection path').length,0);
  }finally{practice.cleanup();}
});
