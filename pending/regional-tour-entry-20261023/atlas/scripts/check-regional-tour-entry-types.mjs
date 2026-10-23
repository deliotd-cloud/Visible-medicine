import fs from 'node:fs';import path from 'node:path';import ts from 'typescript';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const loaded=ts.readConfigFile('tsconfig.json',ts.sys.readFile);assert(!loaded.error);
const config=ts.parseJsonConfigFileContent(loaded.config,ts.sys,process.cwd());assert.equal(config.errors.length,0);assert(config.options.strict);
const roots=['lib/regional-tour-entry.ts','app/body-explorer.tsx','app/whole-body-guided-learning.tsx','integration/head-neck/main.tsx','worker-configuration.d.ts'];
const program=ts.createProgram(roots,{...config.options,noEmit:true,incremental:false}),diagnostics=ts.getPreEmitDiagnostics(program);
const sha=value=>createHash('sha256').update(value).digest('hex');
const result={at:new Date().toISOString(),root:process.cwd(),roots,actualStrictConfiguration:true,fullProject:false,moduleSubstitutions:false,configSha256:sha(fs.readFileSync('tsconfig.json')),compilerOptions:config.options,
  sourceFiles:program.getSourceFiles().map(f=>({path:path.resolve(f.fileName),sha256:sha(fs.readFileSync(f.fileName))})),
  diagnostics:diagnostics.map(d=>({code:d.code,file:d.file?.fileName,start:d.start,message:ts.flattenDiagnosticMessageText(d.messageText,'\n')}))};
const phase=process.env.VM_TOUR_TYPE_PHASE??'types';assert(['types','types-v2','types-v3'].includes(phase));
fs.writeFileSync('../checks/'+phase+'/RESULT.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
if(diagnostics.length)console.error(ts.formatDiagnosticsWithColorAndContext(diagnostics,{getCurrentDirectory:ts.sys.getCurrentDirectory,getCanonicalFileName:f=>f,getNewLine:()=> '\n'}));
console.log(JSON.stringify({roots:roots.length,sourceFiles:result.sourceFiles.length,diagnostics:diagnostics.length,fullProject:false,actualStrictConfiguration:true}));assert.equal(diagnostics.length,0);
