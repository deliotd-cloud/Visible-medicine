import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';

const root=new URL('../',import.meta.url);
const require=createRequire(new URL('package.json',root));
const ts=require('typescript');
const source=readFileSync(new URL('components/atlas-runtime-expansion.ts',root),'utf8');
const code=ts.transpileModule(source,{fileName:'atlas-runtime-expansion.ts',compilerOptions:{
  module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,
}}).outputText;
const module={exports:{}};
new Function('module','exports',code)(module,module.exports);
assert.equal(typeof module.exports.createAtlasRuntimeExpansion,'function');

/** The real local controller, compiled from the candidate source for frame SSR. */
export const atlasRuntimeExpansionModule=module.exports;
