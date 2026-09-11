// Verified against the two retained commits; offline test history, not runtime state.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import record from '../content/tentorium-recipe-transition.json' with { type: 'json' };
import { preLimbVascularRecipeProfiles } from './limb-vascular-recipe-history.mjs';
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function preTentoriumRecipeProfiles(profiles) {
  profiles = preLimbVascularRecipeProfiles(profiles);
  assert.equal(hash(record),'a2a63e053a88e8fbee02b2cc186289f5794135e67571085857dca1271a648e44');
  if(hash(profiles)!==record.after) return profiles; // Earlier historical caller still applies its own exact guard.
  const previous=structuredClone(profiles);
  for(const p of record.patches) {
    if(p.field==='focuses') {
      const ids=p.added.map(s=>s.id);
      assert.deepEqual(previous[p.region].focuses.filter(s=>ids.includes(s.id)),p.added);
      previous[p.region].focuses=previous[p.region].focuses.filter(s=>!ids.includes(s.id));
    } else {
      assert.equal(p.field,'limitations');
      assert.deepEqual(previous[p.region].limitations,p.after);
      previous[p.region].limitations=structuredClone(p.before);
    }
  }
  assert.equal(hash(previous),record.before,'Every pre-tentorium recipe retained');
  return previous;
}
