import assert from 'node:assert/strict';import test from 'node:test';import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';import {runInNewContext} from 'node:vm';import {build} from 'esbuild';
const parent='F:/VisibleMedicine/staging/20261024-orbital-ct-draft/atlas',root=process.cwd(),require=createRequire(root+'/package.json');
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),read=p=>readFileSync(p,'utf8');
async function button(atlas){const result=await build({stdin:{contents:"export {Button,buttonVariants} from './components/ui/button';",resolveDir:atlas,loader:'tsx'},absWorkingDir:atlas,bundle:true,write:false,format:'cjs',platform:'node',jsx:'automatic',packages:'external'});const scope={exports:{}};runInNewContext(result.outputFiles[0].text,{module:scope,exports:scope.exports,require});return scope.exports;}
const current=await button(root),previous=await button(parent);
const variants=['default','outline','secondary','ghost','destructive','link'];
const luminance=rgb=>rgb.map(v=>v/255).map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[0.2126,0.7152,0.0722][i],0);
const contrast=(a,b)=>{const values=[luminance(a),luminance(b)].sort((x,y)=>y-x);return(values[0]+0.05)/(values[1]+0.05);};
const hex=s=>s.match(/../g).map(v=>Number.parseInt(v,16));
test('actual Base UI Button exposes each semantic variant without changing previous attributes, classes or children',()=>{
 for(const variant of variants){const props={variant,size:'icon','aria-label':'Toggle labels','aria-pressed':variant==='secondary',disabled:false,type:'button',tabIndex:0};
  const now=renderToStaticMarkup(React.createElement(current.Button,props,React.createElement('svg',{'aria-hidden':true}))),before=renderToStaticMarkup(React.createElement(previous.Button,props,React.createElement('svg',{'aria-hidden':true})));
  assert(now.includes(`data-variant="${variant}"`));assert.equal(now.replace(` data-variant="${variant}"`,''),before);assert.equal(current.buttonVariants(props),previous.buttonVariants(props));
 }
});
test('default, null variant, disabled and caller props retain existing Base UI behavior',()=>{
 for(const props of [{},{variant:null},{variant:'secondary',disabled:true,'aria-label':'Unavailable labels'},{variant:'ghost',type:'submit',name:'action',value:'reset',tabIndex:-1}]){
  const now=renderToStaticMarkup(React.createElement(current.Button,props,'Action')),before=renderToStaticMarkup(React.createElement(previous.Button,props,'Action'));
  assert.equal(now.replace(/ data-variant="[^"]+"/,''),before);
 }
});
test('the real toolbar selected style uses the approved palette and clears icon and text contrast thresholds',()=>{
 const css=read(root+'/app/body-explorer.css'),globals=read(root+'/app/globals.css'),rule=css.match(/\.body-toolbar button\[data-variant='secondary'\] \{\n([^}]+)\}/)?.[1];assert(rule);
 assert.match(rule,/background: var\(--vm-teal\);/);assert.match(rule,/color: var\(--vm-midnight\);/);
 const teal=globals.match(/--vm-teal: #([a-f0-9]{6})/)[1],ink=globals.match(/--vm-midnight: #([a-f0-9]{6})/)[1],ratio=contrast(hex(teal),hex(ink));assert(ratio>=4.5,'Selected icon/text remain distinct');
 const original=contrast([223,235,217],[232,238,235]);assert(original<3,'Observed actual baseline fails non-text contrast');
 console.log(JSON.stringify({baselineIconContrast:original,selectedContrast:ratio,nonTextMinimum:3,textMinimum:4.5,reference:'https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html',wholeWebsiteAccessibilityClaimed:false}));
});
test('the complete original component, stylesheet and package reconstruct through only the declared seams',()=>{
 const component=read(root+'/components/ui/button.tsx'),seam='      data-variant={variant}\n';assert.equal(component.split(seam).length,2);assert.equal(component.replace(seam,''),read(parent+'/components/ui/button.tsx'));
 const css=read(root+'/app/body-explorer.css'),after=".body-toolbar button[data-variant='secondary'] {\n  background: var(--vm-teal);\n  color: var(--vm-midnight);\n}",before=".body-toolbar button[data-variant='secondary'] {\n  background: #5b7851;\n}",hover=".body-toolbar button[data-variant='ghost']:hover {\n  background: var(--vm-midnight);\n  color: var(--vm-ivory);\n}\n";assert.equal(css.split(after).length,2);assert.equal(css.split(hover).length,2);assert.equal(css.replace(after,before).replace(hover,''),read(parent+'/app/body-explorer.css'));
 const pkg=read(root+'/package.json'),alias='    "toolbar-contrast:test": "node --test scripts/test-toolbar-contrast.mjs",\n';assert.equal(pkg.split(alias).length,2);assert.equal(pkg.replace(alias,''),read(parent+'/package.json'));
 for(const p of ['app/body-explorer.tsx','app/body-content.ts','app/body-scene.tsx','lib/guided-playback.ts','package-lock.json','public/models/bodyparts3d/full-body/catalog.json','content/regional-teaching/head-neck.json'])assert.equal(read(root+'/'+p),read(parent+'/'+p),p);
});
test('unpressed hovered toolbar controls keep a different visible state with high-contrast icons',()=>{
 const css=read(root+'/app/body-explorer.css'),globals=read(root+'/app/globals.css'),rule=css.match(/\.body-toolbar button\[data-variant='ghost'\]:hover \{\n([^}]+)\}/)?.[1];assert(rule);assert.match(rule,/background: var\(--vm-midnight\);/);assert.match(rule,/color: var\(--vm-ivory\);/);
 const ivory=globals.match(/--vm-ivory: #([a-f0-9]{6})/)[1],ink=globals.match(/--vm-midnight: #([a-f0-9]{6})/)[1],ratio=contrast(hex(ivory),hex(ink));assert(ratio>=4.5);assert(contrast([223,235,217],[237,241,239])<3);console.log(JSON.stringify({ghostHoverContrast:ratio,selectedAndGhostBackgroundsRemainDistinct:true}));
});
