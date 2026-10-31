import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const baseline='G:/VisibleMedicine-temp/staging/20261031-release21-repairs/website',root='G:/VisibleMedicine-temp/proposals/20261031-atlas-hub-image-tests',sha=b=>createHash('sha256').update(b).digest('hex');
const edits=[['tests/atlas-navigation.test.ts',[["assert.ok(cards.includes(\"import Image from 'next/image'\"));","assert.ok(cards.includes(\"import Image from './SiteImage'\"));"]]],['tests/public-copy-review.test.ts',[["    if (name === 'next/image') return ({unoptimized: _unused, ...props}: Record<string, unknown>) => React.createElement('img', props);",`    if (name === './SiteImage') {
      const imageSource = readFileSync(new URL('../components/SiteImage.tsx', import.meta.url), 'utf8');
      const imageCode = ts.transpileModule(imageSource, {compilerOptions: {
        jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, esModuleInterop: true,
      }}).outputText;
      const image = {exports: {}};
      new Function('require', 'module', 'exports', imageCode)((dependency: string) =>
        dependency === '../lib/site-image' ? require('../lib/site-image.ts') : require(dependency), image, image.exports);
      return image.exports;
    }`]]]];
const files=[];for(const [file,replacements]of edits){const before=fs.readFileSync(baseline+'/'+file);let after=before.toString();for(const[a,b]of replacements){assert.equal(after.split(a).length,2,file);after=after.replace(a,b);}fs.mkdirSync(path.dirname(root+'/files/'+file),{recursive:true});fs.writeFileSync(root+'/files/'+file,after,{flag:'wx'});files.push({path:file,beforeSha256:sha(before),afterSha256:sha(after)});}
fs.writeFileSync(root+'/MANIFEST.json',JSON.stringify({schema:'vm-hub-current-image-tests/1',baseline,files,scope:'Use the actual staged SiteImage component in rendering tests and retain all equal-frame/static-image/privacy and copy assertions. Existing site-image.test.mjs checks attribute equivalence with installed Vinext.'},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({proposal:root,files:files.length}));
