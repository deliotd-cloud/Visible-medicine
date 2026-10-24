// Original complete page scenarios retain their genuine pre-navigation source.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const receipt='F:/VisibleMedicine/staging/20261024-practice-actions-website/SOURCE_BOUND.json';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
assert.equal(sha(readFileSync(receipt)),'dc0532736094fcd7225e1229af3a41322aacc591789bf1179c44476b98b7077e');
const parent=JSON.parse(readFileSync(receipt)),page='app/workspace/atlas-review/head-learning/page.tsx',test='tests/head-mri-comparison-page.test.ts';
assert.equal(sha(readFileSync(parent.website+'/'+page)),parent.sourceRows.find(row=>row.path===page)?.sha256);
assert.equal(sha(readFileSync(new URL('./head-mri-comparison-page.test.ts',import.meta.url))),parent.sourceRows.find(row=>row.path===test)?.sha256);
assert.equal(process.env.PAGE_SOURCE,undefined);process.env.PAGE_SOURCE=parent.website+'/'+page;
await import('./head-mri-comparison-page.test.ts');
