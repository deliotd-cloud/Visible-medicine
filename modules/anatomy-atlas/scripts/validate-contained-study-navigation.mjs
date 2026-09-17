import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {build} from './workspace-component-test-build.mjs';
const compiled=await build({stdin:{contents:`export {StudyLinks} from './app/study-links';
export {Link} from './integration/head-neck/framework';
export {regionalModules,parseRegionalModule} from './integration/head-neck/regions';
export {bodyDisplayCatalog} from './lib/body-display-catalog';
export {studyDestinations,parseStudyLink,resolveStudyLink} from './lib/study-links';`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,platform:'node',format:'cjs'});
const require=createRequire(import.meta.url),React=require('react'),render=require('react-dom/server').renderToStaticMarkup;
const module={exports:{}};
runInNewContext(compiled.outputFiles[0].text,{module,exports:module.exports,URL,URLSearchParams,console,
  require:id=>id==='next/link'?props=>React.createElement(module.exports.Link,props):require(id)});
const api=module.exports,catalog=api.bodyDisplayCatalog(JSON.parse(await readFile('public/models/bodyparts3d/full-body/catalog.json','utf8')));
let checked=0,crossRegion=0;
for(const region of Object.keys(api.regionalModules)){
  const selected=catalog.structures.find(s=>s.system==='skeleton'&&(region==='whole-body'||s.regions.includes(region)));
  assert(selected);
  const destinations=api.studyDestinations(catalog,selected,region,'both');
  const html=render(React.createElement(api.StudyLinks,{catalog,selected,region,side:'both',focusId:null,assetBase:'/atlas-runtime/head-neck'}));
  const links=[...html.matchAll(/<a ([^>]+)>([^<]+) · keep selection<\/a>/g)];
  assert.equal(links.length,destinations.length,region+': no regional choices hidden');
  for(let i=0;i<links.length;i++){
    const attrs=links[i][1],url=new URL(attrs.match(/href="([^"]+)"/)[1].replaceAll('&amp;','&'),'https://atlas.test');
    assert.equal(url.pathname,'/atlas/3d');assert(attrs.includes('target="_top"'));
    const destination=destinations[i];
    assert.equal(url.searchParams.get('region')??'whole-body',destination.region);
    const result=api.resolveStudyLink(catalog,destination.region,api.parseStudyLink(Object.fromEntries(url.searchParams)));
    assert.equal(result.status,'ready');assert.equal(result.selected.id,selected.id);
    if(destination.region!==region)crossRegion++;checked++;
  }
  for(const destination of destinations)for(const focus of destination.focuses){
    const anchor=render(React.createElement(api.Link,{href:focus.href},'Focus'));
    const url=new URL(anchor.match(/href="([^"]+)"/)[1].replaceAll('&amp;','&'),'https://atlas.test');
    assert(anchor.includes('target="_top"'));assert.equal(url.pathname,'/atlas/3d');
    const result=api.resolveStudyLink(catalog,destination.region,api.parseStudyLink(Object.fromEntries(url.searchParams)));
    assert.equal(result.status,'ready');assert.equal(result.selected.id,selected.id);checked++;
  }
}
assert(crossRegion>=12,'Whole body and all regions remain reachable with source identity');
console.log(JSON.stringify({passed:true,regions:12,sourceBoundLinks:checked,crossRegion,clinicalApproval:false}));
