import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const sha=source=>createHash('sha256').update(source).digest('hex');
const currentSha="08d7d63455c49c1bab5ea6b8e4f3bf4091b6f7a51a7f5cb413f7ed1927aade54";
const previousSha="7ef70ac4d6acfebf71f71c0acda604abf731b953d09162363166153b20482268";
const seams=[
  [
    "const laterReasoning=new Map([\n  ['vm:anatomy:body:head-neck:midline:organ:choroid-plexus-of-cerebral-hemisphere','ventricular-landmark-choroid-plexus'],\n]);\n",
    ""
  ],
  [
    "  assert.equal(laterReasoning.size,1);\n",
    ""
  ],
  [
    "    const laterQuestion=laterReasoning.get(s.id);\n",
    ""
  ],
  [
    "    for(const key of Object.keys(packet).filter(key=>!['guidedTours','fingerprints','materialHash'].includes(key))){\n      if(key==='reasoning'&&laterQuestion){\n        assert.equal(packet.reasoning,null,`${s.id}: neonatal epoch precedes the current reasoning question`);\n        assert.equal(livePacket.reasoning?.key,laterQuestion,`${s.id}: exact current reasoning key`);\n        assert.equal(livePacket.reasoning?.readiness,'draft',`${s.id}: reasoning awaits review`);\n        assert.equal(livePacket.reasoning?.answerId,s.id,`${s.id}: exact current answer identity`);\n      }else assert.deepEqual(livePacket[key],packet[key],`${s.id}: complete non-tour field ${key}`);\n    }\n",
    "    for(const key of Object.keys(packet).filter(key=>!['guidedTours','fingerprints','materialHash'].includes(key)))\n      assert.deepEqual(livePacket[key],packet[key],`${s.id}: complete non-tour field ${key}`);\n"
  ],
  [
    "    }else if(laterQuestion){\n      assert.notEqual(livePacket.fingerprints.teaching,packet.fingerprints.teaching,`${s.id}: current question changes teaching`);\n      assert.notEqual(livePacket.materialHash,packet.materialHash,`${s.id}: current question changes material`);\n",
    ""
  ],
  [
    "    if(laterQuestion){\n      for(const change of ['answerId','explanation','reference','source','readiness']){\n        const altered=wire(livePacket);\n        if(change==='answerId')altered.reasoning.answerId='vm:foreign-answer';\n        if(change==='explanation')altered.reasoning.explanation+=' forged';\n        if(change==='reference')altered.reasoning.references[0].url='javascript:alert(1)';\n        if(change==='source')altered.reasoning.choices[0].sources[0].sha256='0'.repeat(64);\n        if(change==='readiness')altered.reasoning.readiness='approved';\n        assert.equal(await liveApi.parseBodyReviewResponse(altered,s.id),null,`${s.id}: current reasoning ${change} refused`);\n      }\n    }\n",
    ""
  ],
  [
    "    const laterCurrentTeaching=!!laterTour||!!laterQuestion;\n",
    ""
  ],
  [
    "      if(laterCurrentTeaching)assert.notEqual(liveContext[key],context[key],`${s.id}: playback or reasoning changes ${key}`);\n",
    "      if(laterTour)assert.notEqual(liveContext[key],context[key],`${s.id}: playback changes ${key}`);\n"
  ],
  [
    "    if(laterCurrentTeaching)assert.notEqual(liveContext.revisions.teaching,context.revisions.teaching,\n      `${s.id}: playback or reasoning changes teaching decision revision`);\n",
    "    if(laterTour)assert.notEqual(liveContext.revisions.teaching,context.revisions.teaching,\n      `${s.id}: playback changes teaching decision revision`);\n"
  ],
  [
    "    if(laterCurrentTeaching)assert.equal((await liveSave(decision)).status,409,\n      `${s.id}: historical decision is stale after current playback or reasoning`);\n",
    "    if(laterTour)assert.equal((await liveSave(decision)).status,409,\n      `${s.id}: historical decision is stale after current playback`);\n"
  ]
];

export function restorePreNeonatalReasoningRole(source){
  assert.equal(typeof source,'string','Exact neonatal test source text required');
  assert.equal(sha(source),currentSha,'Exact current neonatal source role required');
  let restored=source;
  for(const [now,before] of seams){
    assert.equal(restored.split(now).length,2,'Exactly one declared current reasoning seam');
    restored=restored.replace(now,before);
  }
  assert.equal(sha(restored),previousSha,'Complete staged neonatal preimage recovered');
  return restored;
}
