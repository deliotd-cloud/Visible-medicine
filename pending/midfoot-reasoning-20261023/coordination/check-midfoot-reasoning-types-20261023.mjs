// Actual strict application consumer graph; no module replacements or skip repair.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {createHash} from 'node:crypto';
const root=process.cwd(),require=createRequire(root+'/package.json'),ts=require('typescript');
const loaded=ts.readConfigFile('tsconfig.json',ts.sys.readFile);assert(!loaded.error);
const config=ts.parseJsonConfigFileContent(loaded.config,ts.sys,root);assert.equal(config.errors.length,0);assert(config.options.strict);
const roots=['lib/midfoot-relationships-reasoning.ts','lib/reasoning-questions.ts','app/reasoning-feedback.tsx','lib/body-review-response.ts','worker-configuration.d.ts'];
const program=ts.createProgram(roots,{...config.options,noEmit:true,incremental:false}),diagnostics=ts.getPreEmitDiagnostics(program),sha=b=>createHash('sha256').update(b).digest('hex');
const result={at:new Date().toISOString(),root,roots,actualStrictConfiguration:true,fullProject:false,moduleSubstitutions:false,configSha256:sha(fs.readFileSync('tsconfig.json')),compilerOptions:config.options,sourceFiles:program.getSourceFiles().map(f=>({path:path.resolve(f.fileName),sha256:sha(fs.readFileSync(f.fileName))})),diagnostics:diagnostics.map(d=>({code:d.code,file:d.file?.fileName,start:d.start,message:ts.flattenDiagnosticMessageText(d.messageText,'\n')}))};
fs.writeFileSync('../checks/types/RESULT.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
if(diagnostics.length)console.error(ts.formatDiagnosticsWithColorAndContext(diagnostics,{getCurrentDirectory:ts.sys.getCurrentDirectory,getCanonicalFileName:f=>f,getNewLine:()=> '\n'}));
console.log(JSON.stringify({roots:roots.length,files:result.sourceFiles.length,diagnostics:diagnostics.length,actualStrictConfiguration:true,fullProject:false}));assert.equal(diagnostics.length,0);
