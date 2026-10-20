import {readFileSync} from 'node:fs';
import ts from 'typescript';

/** Execute the real grouped control and debounce logic inside shallow form tests. */
export function loadReviewUiHelpers(jsxRuntime: {jsx: Function; jsxs: Function; Fragment: unknown}) {
  function evaluate(url: URL, load: (id: string) => unknown) {
    const source = readFileSync(url, 'utf8');
    const compiled = ts.transpileModule(source, {compilerOptions: {jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}}).outputText;
    const mod = {exports: {} as any};
    new Function('require', 'module', 'exports', compiled)(load, mod, mod.exports);
    return mod.exports;
  }
  const grouped = evaluate(new URL('../components/GroupedReviewConfirmation.tsx', import.meta.url), id => {
      if (id === 'react/jsx-runtime') return jsxRuntime;
      throw Error(`Unexpected grouped-control import: ${id}`);
    });
  const actualAutosave = evaluate(new URL('../lib/review-draft-autosave.ts', import.meta.url), id => {
      throw Error(`Unexpected autosave import: ${id}`);
    });
  const timers = new Map<number, () => void>();
  let nextTimer = 0;
  return {
    grouped,
    autosave: {
      ...actualAutosave,
      createReviewDraftAutosave: () => actualAutosave.createReviewDraftAutosave(
        2500,
        (callback: () => void) => {const id = ++nextTimer; timers.set(id, callback); return id;},
        (id: number) => {timers.delete(id);},
      ),
    },
    fireAutosave() {const callbacks = [...timers.values()]; timers.clear();callbacks.forEach(callback => callback());},
    pendingAutosave() {return timers.size;},
  };
}
