import {readFileSync} from 'node:fs';import{createRequire}from'node:module';import{resolve}from'node:path';
const site=process.env.VISIBLE_MEDICINE_WEBSITE??process.cwd(),require=createRequire(resolve(site,'package.json')),ts=require('typescript'),module={exports:{}};
const compiled=ts.transpileModule(readFileSync(resolve(site,'lib/learner-portfolio-pagination.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
new Function('module','exports',compiled)(module,module.exports);export const portfolioPagination=module.exports;
