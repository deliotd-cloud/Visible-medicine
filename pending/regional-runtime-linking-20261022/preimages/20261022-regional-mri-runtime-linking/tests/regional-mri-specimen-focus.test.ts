import assert from 'node:assert/strict';
import test from 'node:test';
import {createRegionalMriSpecimenFocus,publicSpecimenTarget} from '../lib/regional-mri-specimen-focus.ts';
import type {RegionalMriInlineInspection} from '../lib/regional-mri-inline-inspection.ts';

test('unowned or body-like context cannot start specimen messages',()=>{
 const sent:object[]=[],states:string[]=[];
 const host=createRegionalMriSpecimenFocus(message=>sent.push(message),state=>states.push(state));
 const borrowed={target:{kind:'specimen'},atlasRevision:'a'.repeat(40)} as RegionalMriInlineInspection;
 assert.equal(publicSpecimenTarget(borrowed),null);
 host.begin(borrowed);host.receive({type:'vm-specimen-selection-ready',version:1,revision:'a'.repeat(40)});
 assert.equal(host.state,'failed');assert.deepEqual(sent,[]);
 host.close();assert.equal(host.state,'waiting');assert(states.includes('failed'));
});
