import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { hash } from './seal-simple-website-successor.mjs';

const root = process.cwd().replaceAll('\\', '/');
const ts = createRequire(root + '/package.json')('typescript');
const config = root + '/tsconfig.json', loaded = ts.readConfigFile(config, ts.sys.readFile);
assert(!loaded.error);
const parsed = ts.parseJsonConfigFileContent(loaded.config, ts.sys, root);
assert.equal(parsed.errors.length, 0); assert.equal(parsed.options.strict, true);
const roots = ['lib/body-pancreatic-venous-us.ts', 'app/body-content.ts'].map(p => root + '/' + p);
const ambient = parsed.fileNames.filter(p => p.endsWith('.d.ts'));
const overrides = { noEmit: true, incremental: false, composite: false, tsBuildInfoFile: undefined };
const program = ts.createProgram([...roots, ...ambient], { ...parsed.options, ...overrides });
const diagnostics = ts.getPreEmitDiagnostics(program);
fs.writeFileSync(process.argv[2], JSON.stringify({
  at: new Date().toISOString(), config, configSha256: hash(config), typescriptVersion: ts.version,
  roots, ambient, configuredCompilerOptions: parsed.options, overrides,
  sourceFiles: program.getSourceFiles().map(file => ({path: file.fileName, sha256: hash(file.fileName)})),
  diagnosticCount: diagnostics.length,
  diagnostics: diagnostics.map(item => ({code: item.code, path: item.file?.fileName, message: ts.flattenDiagnosticMessageText(item.messageText, '\n')})),
  sourceOverlayCount: 0, typeShims: false, actualCompilerGraph: true,
  fullProjectTypesPassed: false, resourceUsage: process.resourceUsage(),
}, null, 2) + '\n', {flag: 'wx'});
console.log(JSON.stringify({roots: roots.length, files: program.getSourceFiles().length, diagnostics: diagnostics.length, maxRSSKiB: process.resourceUsage().maxRSS}));
if (diagnostics.length) process.exitCode = 1;
