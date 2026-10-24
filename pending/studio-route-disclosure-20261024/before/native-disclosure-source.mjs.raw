import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import ts from 'typescript';
const require=createRequire(import.meta.url),sha=b=>createHash('sha256').update(b).digest('hex');
const contracts=[{"path":"components/StudioNavigation.tsx","beforeSha256":"78ed4dffdfc51c15cb050ab9ba6d9aa20983d39e47e31ec6153a4beb8d634d59","afterSha256":"de7532406b4def25c1dfad8bfa024cfe1b249f7f04603b5853691c416c398ef1","edits":[["import Link from \"next/link\";","import Link from \"next/link\";\nimport {NativeDisclosure} from \"./NativeDisclosure\";"],["<details","<NativeDisclosure",1],["</details>","</NativeDisclosure>",1]]},{"path":"components/AtlasWorkspaceNavigation.tsx","beforeSha256":"10ee9a5fa4e20c6413be5f3608c58c7728c59bd7930a6bb243762fc284db58bc","afterSha256":"bdb3b0801d047c0061ea5cd4db6080c4c2fa5e6c4777f32469844711c7458aec","edits":[["import Link from 'next/link';","import Link from 'next/link';\nimport {NativeDisclosure} from './NativeDisclosure';"],["<details","<NativeDisclosure",1],["</details>","</NativeDisclosure>",1]]},{"path":"app/workspace/page.tsx","beforeSha256":"5db80991307ffd7f8d3164e516bb68a08544b2d9a8e040fa5f6df747550d26e5","afterSha256":"f2cb7a59721ac606632f6acebbedd6dd08e001b579c6fd75a764fe2f8ed56599","edits":[["import Link from \"next/link\";","import Link from \"next/link\";\nimport {NativeDisclosure} from \"../../components/NativeDisclosure\";"],["<details","<NativeDisclosure",4],["</details>","</NativeDisclosure>",4]]}];
export function restoreNativeDisclosureConsumer(path,bytes){
 const row=contracts.find(r=>r.path===path);assert(row,'Only explicit native-disclosure consumers');assert.equal(sha(bytes),row.afterSha256,'Exact current consumer bytes');let source=Buffer.from(bytes).toString();
 for(const [before,after,n=1]of row.edits.toReversed()){assert.equal(source.split(after).length-1,n);source=source.split(after).join(before);}
 const restored=Buffer.from(source);assert.equal(sha(restored),row.beforeSha256);return restored;
}
let actual;
export function loadNativeDisclosure(){
 if(!actual){const source=readFileSync(new URL('../components/NativeDisclosure.tsx',import.meta.url),'utf8');const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,module={exports:{}};
  new Function('require','module','exports',code)(name=>name==='../lib/head-disclosure-keyboard'?require('../lib/head-disclosure-keyboard.ts'):require(name),module,module.exports);actual=module.exports.NativeDisclosure;assert.equal(typeof actual,'function');}
 return actual;
}
