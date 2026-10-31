import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const root='G:/VisibleMedicine-temp/proposals/20261031-atlas-image-history',baseline='G:/VisibleMedicine-temp/staging/20261031-release21-followup/website',sha=b=>createHash('sha256').update(b).digest('hex');
const file='tests/site-image.test.mjs',before=fs.readFileSync(baseline+'/'+file);let text=before.toString();
const replace=(a,b)=>{assert.equal(text.split(a).length,2,a);text=text.replace(a,b);};
replace("test('six callers reverse to fixed original baseline hashes with one import replacement'", "test('original six-caller image migration remains authenticated beside current callers'");
replace("    const proposed = await readFile(resolve(import.meta.dirname, '..', path));\n    const text = proposed.toString('utf8');",`    const current = await readFile(resolve(import.meta.dirname, '..', path), 'utf8');
    // Freeze the admitted migration witness; later Atlas copy changes have their own rendered tests.
    const text = path === 'components/AtlasModalityCards.tsx'
      ? await readFile(resolve(import.meta.dirname, 'fixtures/site-image-initial-atlas-cards.tsx.raw'), 'utf8')
      : current;`);
replace("    assert.doesNotMatch(text, /next\\/image/, path);", "    assert.doesNotMatch(text, /next\\/image/, path);\n    assert.equal([...current.matchAll(importPattern)].length, 1, `${path}: current caller uses the migrated image`);\n    assert.doesNotMatch(current, /next\\/image/, path);");
const fixture='tests/fixtures/site-image-initial-atlas-cards.tsx.raw',witness=fs.readFileSync('G:/VisibleMedicine-temp/staging/20261031-release20-final/website/components/AtlasModalityCards.tsx');
const original=witness.toString().replace("import Image from './SiteImage';","import Image from 'next/image';");assert.equal(sha(original),'e0dd1f9c270ab8d9040cafa3ffd893de48baeca60d614168076e79d22db02dfd');
const files=[];for(const [relative,bytes,previous]of [[file,text,sha(before)],[fixture,witness,null]]){const target=root+'/files/'+relative;fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes,{flag:'wx'});files.push({path:relative,beforeSha256:previous,afterSha256:sha(bytes)});}
fs.writeFileSync(root+'/MANIFEST.json',JSON.stringify({schema:'vm-site-image-history/1',baseline,files,witnessOrigin:'G:/VisibleMedicine-temp/staging/20261031-release20-final/website/components/AtlasModalityCards.tsx',witnessSha256:sha(witness),scope:'Exact original six-caller image-migration proof retained; changed Atlas copy uses frozen initial component witness. Actual current import and rendered Atlas guidance/availability plus image attributes checked independently.'},null,2)+'\n',{flag:'wx'});
let integration=fs.readFileSync('G:/VisibleMedicine-temp/proposals/20261031-release22-main/integrate-followup.mjs','utf8');
integration=integration.replace("parentPath='G:/VisibleMedicine-temp/staging/20261031-release21-repairs/SOURCE.json',root='G:/VisibleMedicine-temp/staging/20261031-release21-followup'","parentPath='G:/VisibleMedicine-temp/staging/20261031-release21-followup/SOURCE.json',root='G:/VisibleMedicine-temp/staging/20261031-release21-final'").replace('d1d66172d076c92f6d32167ad98f487e22d6c13ac6e942d072557421771c3c77','d32838ba53f570721d3dc230e573a0395d61e7ec28be85029a532059de069c98');
const a=integration.indexOf('const inputs='),b=integration.indexOf('const proposals=',a);assert(a>0&&b>a);integration=integration.slice(0,a)+'const inputs='+JSON.stringify([[root,sha(fs.readFileSync(root+'/MANIFEST.json'))]])+';\n'+integration.slice(b);
fs.writeFileSync('G:/VisibleMedicine-temp/proposals/20261031-release22-main/integrate-final.mjs',integration,{flag:'wx'});
console.log(JSON.stringify({proposal:root,files:files.length}));
