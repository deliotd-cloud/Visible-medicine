import assert from 'node:assert/strict';
import test from 'node:test';
import {validateUiPlan} from './prepare-unbound-ui-successor.mjs';
const hash='a'.repeat(64),head='b'.repeat(40),before='c'.repeat(64);
const source={website:'F:/VisibleMedicine/staging/example/website',sourceRows:[{path:'components/StudioCourseEditor.tsx',sha256:before}]};
const plan=()=>({root:'F:/VisibleMedicine/staging/new-isolated-ui',sourceReceipt:'F:/VisibleMedicine/staging/example/SOURCE.json',sourceReceiptSha256:hash,canonicalHead:head,atlasHead:head,
 overlays:[{path:'components/StudioCourseEditor.tsx',code:'F:/VisibleMedicine/staging/proposal/CODE/components/StudioCourseEditor.tsx',sha256:hash,before:'F:/VisibleMedicine/staging/proposal/RAW/components/StudioCourseEditor.tsx',beforeSha256:before}]});
test('bounded unbound UI plan passes pure validation without touching filesystem',()=>assert.equal(validateUiPlan(plan(),source,new Set()),true));
test('Review-bound source is refused rather than silently retaining an old binding',()=>assert.throws(()=>validateUiPlan(plan(),source,new Set(['components/StudioCourseEditor.tsx']))));
for(const [label,edit] of [
 ['canonical root',p=>p.root='F:/VisibleMedicine/website'],['traversal',p=>p.root='F:/VisibleMedicine/staging/../website'],
 ['private source',p=>p.overlays[0].path='.env.local'],['dependency source',p=>p.overlays[0].path='package.json'],
 ['validator',p=>{p.overlays[0].path='tests/current-atlas-delivery.mjs';p.overlays[0].beforeSha256=null;}],
 ['wrong preimage',p=>p.overlays[0].beforeSha256=hash],['missing before',p=>p.overlays[0].before=null],
 ['duplicate target',p=>p.overlays.push({...p.overlays[0]})],['unreviewed product addition',p=>{p.overlays[0].path='components/NewWidget.tsx';p.overlays[0].beforeSha256=null;}],
])test(label+' is refused before clone or source copy',()=>{const p=plan();edit(p);assert.throws(()=>validateUiPlan(p,source,new Set()));});
