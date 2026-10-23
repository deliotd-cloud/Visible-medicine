// Actual configured semantic types for the new module and its source guard.
import ts from 'typescript';
import assert from 'node:assert/strict';
const file=ts.readConfigFile('tsconfig.json',ts.sys.readFile);assert(!file.error);
const config=ts.parseJsonConfigFileContent(file.config,ts.sys,process.cwd());assert.equal(config.errors.length,0);
const roots=['lib/ventricular-landmark-reasoning.ts','lib/reasoning-questions.ts'];
const program=ts.createProgram(roots,{...config.options,noEmit:true,incremental:false});
const diagnostics=ts.getPreEmitDiagnostics(program);
if(diagnostics.length)console.error(ts.formatDiagnosticsWithColorAndContext(diagnostics,{getCurrentDirectory:ts.sys.getCurrentDirectory,getCanonicalFileName:f=>f,getNewLine:()=> '\n'}));
console.log(JSON.stringify({roots,sourceFiles:program.getSourceFiles().length,diagnostics:diagnostics.length,fullProject:false,configuration:'Actual strict project configuration; only noEmit/incremental execution flags set'}));
assert.equal(diagnostics.length,0);
