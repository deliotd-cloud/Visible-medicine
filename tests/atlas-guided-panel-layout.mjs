// Actual imported UI regression, mechanically adapted from Atlas 88cea927d48729769b96ad8fe680b0872b7e6687. All assertions retained.
/* oxlint-disable react-hooks/rules-of-hooks -- controlled hooks render the production components */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {test} from 'node:test';
import {build as esbuild} from 'esbuild';
const build=options=>esbuild({...options,packages:'external',alias:{'@':process.cwd()},loader:{'.css':'empty'},tsconfigRaw:{compilerOptions:{jsx:'react-jsx'}}});

const require=createRequire(import.meta.url), React=require('react');
const built=await build({stdin:{contents:"export {ShoulderTourPlayer} from './atlas-review/app/shoulder-tour-player'; export {shoulderTour} from './atlas-review/lib/shoulder-tours'; export {RegionalGuidedLearning} from './atlas-review/app/regional-guided-learning'; export {thoraxTour} from './atlas-review/lib/regional-tours'; export {bodyDisplayCatalog} from './atlas-review/lib/body-display-catalog';",loader:'tsx',resolveDir:process.cwd()},bundle:true,write:false,format:'cjs',platform:'node',loader:{'.css':'empty'},plugins:[{name:'scene-boundary',setup(api){
  api.onLoad({filter:/[\\/]app[\\/]body-scene\.tsx$/},()=>({loader:'tsx',contents:'export function BodyScene(){return null;} export function retryBodyAssets(){}'}));
  api.onLoad({filter:/[\\/]app[\\/]lazy-body-teaching\.tsx$/},()=>({loader:'tsx',contents:'export function LazyBodyTeaching(){return null;}'}));
}}]});
const nodes=tree=>!tree||typeof tree!=='object'?[]:Array.isArray(tree)?tree.flatMap(nodes):[tree,...nodes(tree.props?.children)];
const words=tree=>tree==null?'':typeof tree==='string'||typeof tree==='number'?String(tree):Array.isArray(tree)?tree.map(words).join(''):words(tree.props?.children);
const find=(tree,className)=>{const found=nodes(tree).filter(node=>node.props?.className===className);assert.equal(found.length,1,`${className} exists once`);return found[0];};
const direct=(parent,className)=>nodes(parent.props.children).filter(node=>node.props?.className===className);
function load(shim=React,extra={}){const mod={exports:{}};runInNewContext(built.outputFiles[0].text,{module:mod,exports:mod.exports,structuredClone,...extra,require(id){if(id==='react')return shim;if(id==='next/dynamic')return ()=>'BodyScene';return require(id);}});return mod.exports;}

test('Shoulder desktop panel keeps the complete current caption and navigation in the primary row',async()=>{
  const api=load();
  for(const index of api.shoulderTour.steps.keys()){
    let pauses=0;
    const tree=api.ShoulderTourPlayer({index,playing:false,ready:true,onStart(){},onPlayPause(){},onStep(){},onExit(){},onReadImaging(){pauses++;}});
    const primary=find(tree,'shoulder-tour-primary'),caption=find(tree,'shoulder-tour-caption'),controls=find(tree,'shoulder-tour-controls');
    assert.equal(direct(primary,'shoulder-tour-caption').length,1);
    assert.equal(direct(primary,'shoulder-tour-controls').length,1);
    assert.equal(words(caption),api.shoulderTour.steps[index].caption);
    assert.equal(caption.props.tabIndex,0);
    assert.deepEqual(nodes(controls).filter(node=>node.props?.onClick).map(words),['Back','Play',index===api.shoulderTour.steps.length-1?'Finish':'Next','Exit tour']);
    assert.equal(find(tree,'shoulder-tour-secondary').type,'div');
    const references=find(tree,'shoulder-tour-evidence');references.props.onToggle({currentTarget:{open:true}});assert.equal(pauses,1);
  }
  const css=await readFile(new URL('../atlas-review/app/shoulder-tour-player.css',import.meta.url),'utf8');
  assert.match(css,/\.shoulder-tour-primary\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\) auto/);
  assert.match(css,/\.shoulder-tour-caption\s*\{[^}]*overflow:\s*auto/);
  assert.match(css,/\.shoulder-tour-secondary\s*\{[^}]*max-height:[^}]*overflow:\s*auto/);
  assert.match(css,/@media\s*\(max-width:\s*900px\)/);
  assert.match(css,/@media\s*\(min-width:\s*1100px\)/);
  assert.match(css,/\.shoulder-model-workspace\[data-tour-active='true'\][^{]*\{[^}]*grid-template-columns:\s*minmax\(18rem,\s*28%\) minmax\(0,\s*1fr\)/);
  assert.match(css,/\.shoulder-model-workspace\[data-tour-active='true'\] \.shoulder-tour-secondary\s*\{[^}]*flex:\s*1;[^}]*min-height:\s*0;[^}]*max-height:\s*none/);
});

test('Regional caption remains visible outside optional resources, with controls beside it',async()=>{
  const slots=[],pending=[];let cursor=0;
  const shim={...React,
    useState(initial){const i=cursor++;slots[i]??=typeof initial==='function'?initial():initial;return [slots[i],value=>{slots[i]=typeof value==='function'?value(slots[i]):value;}]},
    useRef(initial){return slots[cursor++]??={current:initial}},
    useMemo(fn){const i=cursor++;return slots[i]??=fn()},
    useCallback(fn){return fn},
    useEffect(fn){pending.push(fn);cursor++},
    useLayoutEffect(fn){pending.push(fn);cursor++},
  };
  const window={matchMedia:query=>({matches:query.includes('max-width')?false:false,addEventListener(){},removeEventListener(){}})};
  const document={hidden:false,addEventListener(){},removeEventListener(){}};
  const api=load(shim,{window,document});
  const catalog=JSON.parse(await readFile(new URL('../atlas-review/public/models/bodyparts3d/full-body/catalog.json',import.meta.url),'utf8'));
  const tour=api.thoraxTour;const tree=api.RegionalGuidedLearning({catalog:api.bodyDisplayCatalog(catalog),tour,onExit(){}});
  const panel=find(tree,'regional-tour-panel'),primary=find(tree,'regional-tour-primary'),caption=find(tree,'regional-tour-caption');
  assert.equal(direct(primary,'regional-tour-caption').length,1);
  assert.equal(direct(primary,'regional-tour-controls').length,1);
  assert.equal(words(caption),tour.description);
  assert.equal(caption.props.tabIndex,0);
  const explanation=find(panel,'regional-tour-explanation');
  assert.equal(explanation.props.open,true,'desktop resources retain their initial disclosure state');
  assert.equal(direct(explanation,'regional-tour-resources').length,1);
  assert.equal(nodes(explanation).filter(node=>node.props?.className==='regional-tour-caption').length,0);
  const css=await readFile(new URL('../atlas-review/app/regional-guided-learning.css',import.meta.url),'utf8');
  assert.match(css,/\.regional-tour-primary\s*\{[^}]*grid-template-columns:\s*minmax\(0,1fr\) auto/);
  assert.match(css,/\.regional-tour-caption\s*\{[^}]*overflow:\s*auto/);
  assert.match(css,/\.regional-tour-explanation\s*\{[^}]*max-height:[^}]*overflow:\s*auto/);
  assert.match(css,/@media\(max-width:900px\)/);
  assert.match(css,/@media\(min-width:1100px\)/);
  assert.match(css,/\.regional-tour\s*\{[^}]*grid-template-columns:minmax\(18rem,28%\) minmax\(0,1fr\);[^}]*overflow:hidden/);
  assert.match(css,/\.regional-tour-explanation,\.regional-tour-explanation\[open\]\s*\{[^}]*min-height:0;[^}]*max-height:none/);
});
