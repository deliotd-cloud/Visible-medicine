import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import postcss from 'postcss';

// Source guard only; browser checks establish actual geometry and hit testing.
const css = postcss.parse(await readFile('app/body-explorer.css', 'utf8'));
const matches = [];
css.walkRules(rule => { if (rule.selector === '.anatomy-controls-return') matches.push(rule); });
assert.equal(matches.length, 1);
const declarations = Object.fromEntries(matches[0].nodes.filter(node => node.type === 'decl').map(node => [node.prop, node.value]));
assert.equal(declarations.position, 'static');
assert.equal(declarations.bottom, undefined);
assert.equal(declarations['min-height'], '44px');
assert.equal(declarations.width, '100%');
assert.equal(matches[0].parent.type, 'root', 'same non-overlapping footer in all drawer layouts');
const rail = await readFile('app/anatomy-control-rail.tsx', 'utf8');
assert(rail.indexOf('{children}', rail.indexOf('<Dialog.Popup')) < rail.indexOf('className="anatomy-controls-return"'));
assert(rail.includes('onOpenChange={(value) => setPanelOpen(info, value)}'));
assert(rail.includes('aria-label={`Close ${label.toLowerCase()}`}'));
assert(rail.includes('<Dialog.Portal keepMounted>'), 'answers survive closing the drawer');
console.log(JSON.stringify({normalFlowReturn:true,touchTarget:44,existingCloseAndStatePreserved:true,browserGeometryClaim:false}));
