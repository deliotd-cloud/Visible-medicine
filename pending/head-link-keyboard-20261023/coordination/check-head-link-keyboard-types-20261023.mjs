// Actual strict project configuration; just the two changed production components.
import fs from 'node:fs';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
import {hash} from './seal-simple-website-successor.mjs';
const stage='F:/VisibleMedicine/staging/20261023-head-link-menu-keyboard',site=stage+'/website',ts=createRequire(site+'/package.json')('typescript');
const config=ts.readConfigFile(site+'/tsconfig.json',ts.sys.readFile);assert(!config.error);
const parsed=ts.parseJsonConfigFileContent(config.config,ts.sys,site);assert.equal(parsed.errors.length,0);
const roots=['components/HeadAtlasComparisonNavigation.tsx','components/HeadAtlasLearningPicker.tsx'].map(p=>site+'/'+p);
const ambient=parsed.fileNames.filter(p=>p.endsWith('.d.ts'));
const program=ts.createProgram([...roots,...ambient],{...parsed.options,noEmit:true,incremental:false,composite:false,tsBuildInfoFile:undefined});
const diagnostics=ts.getPreEmitDiagnostics(program);
const result={at:new Date().toISOString(),roots,ambient,configSha256:hash(site+'/tsconfig.json'),
 sourceFiles:program.getSourceFiles().map(f=>({path:f.fileName,sha256:hash(f.fileName)})),diagnosticCount:diagnostics.length,
 diagnostics:diagnostics.map(d=>({code:d.code,message:ts.flattenDiagnosticMessageText(d.messageText,'\n'),path:d.file?.fileName,start:d.start})),
 fullProjectTypes:false,previewChanged:false};
fs.writeFileSync(stage+'/checks/'+(process.argv.includes('--corrected')?'TYPES.corrected.json':'TYPES.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({roots:roots.length,ambient:ambient.length,files:result.sourceFiles.length,diagnostics:diagnostics.length}));process.exitCode=diagnostics.length?1:0;
