import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
export function loadOutlineHelper(ts, componentPath) {
  const source = readFileSync(resolve(dirname(componentPath instanceof URL ? fileURLToPath(componentPath) : componentPath), '../lib/studio-outline-navigation.ts'), 'utf8');
  const code = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}}).outputText;
  const module = {exports: {}};
  new Function('module', 'exports', code)(module, module.exports);
  return module.exports;
}
