import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import type {ComponentType,ReactNode} from 'react';
import ts from 'typescript';
import * as navigation from '../lib/head-atlas-navigation.ts';

const require=createRequire(import.meta.url);
const source=readFileSync(new URL('../components/HeadReviewImageLink.tsx',import.meta.url),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS}}).outputText;
const mod={exports:{} as {HeadReviewImageLink:ComponentType<{conceptId:string;modality:'CT'|'MRI';revision:string;children:ReactNode}>}};
new Function('require','module','exports',code)((id:string)=>id==='../lib/head-atlas-navigation'?navigation:require(id),mod,mod.exports);

/** The actual Review link component, with its real navigation implementation. */
export const headReviewImageLinkModule=mod.exports;
