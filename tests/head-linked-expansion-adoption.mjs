import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

const roles=JSON.parse(readFileSync(new URL('./head-linked-expansion-adoption.json',import.meta.url),'utf8'));
const sha=value=>createHash('sha256').update(value).digest('hex');

/** Only the two complete authenticated roles are admitted. No fuzzy removal,
 * generic fallback or assertion substitution is used by historical readers. */
export function projectHeadExpansionRole(path,source){
  const role=roles[path];assert(role,`Undeclared head expansion role: ${path}`);
  assert.equal(typeof source,'string');
  if(sha(source)===role.priorSha256)return source;
  assert.equal(sha(source),role.currentSha256,`${path}: entire current expansion role`);
  let prior=source;
  for(const seam of [...role.seams].reverse()){
    assert.equal(prior.split(seam.current).length,2,`${path}: one exact expansion seam`);
    prior=prior.replace(seam.current,seam.prior);
  }
  assert.equal(sha(prior),role.priorSha256,`${path}: entire original role`);
  return prior;
}
