import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import test from 'node:test';

const require=createRequire(resolve('package.json'));
const postcss=require('postcss');
const cssPath=process.env.VM_FONT_ALIAS_CSS_PATH??resolve('app/globals.css');
const css=postcss.parse(readFileSync(cssPath,'utf8'),{from:cssPath});
const layout=readFileSync(resolve('app/layout.tsx'),'utf8');
function aliasAt(selector){
 const declarations=[];
 css.walkRules(selector,rule=>rule.walkDecls('--font-geist-mono',decl=>declarations.push(decl.value)));
 return declarations;
}

test('root mono alias is independently valid before body provider exists',()=>{
 const values=aliasAt(':root');
 assert.equal(values.length,1);
 assert.doesNotMatch(values[0],/var\(/);
 assert.match(values[0],/(?:^|,)\s*monospace\s*$/);
});

test('body resolves provider on its own element and retains a mono fallback',()=>{
 const values=aliasAt('body');
 assert.equal(values.length,1);
 assert.match(values[0],/^var\(--font-atlas-mono,\s*ui-monospace,.*(?:^|,)\s*monospace\s*\)$/);
});

test('layout applies the matching font variable class to body',()=>{
 assert.match(layout,/const\s+geistMono\s*=/);
 assert.match(layout,/variable:\s*["']--font-atlas-mono["']/);
 assert.match(layout,/<body className=\{geistMono\.variable\}>/);
});
