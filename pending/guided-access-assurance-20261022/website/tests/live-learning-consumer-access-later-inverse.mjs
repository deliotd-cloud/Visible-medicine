// Exact inverse of the two additive access-advisory test roles.
// The live test files still execute every access assertion; only historical
// whole-source readers remove these enumerated additions for their older role.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const sha=text=>createHash('sha256').update(text).digest('hex');
const roles={
  "head-guided-model.test.ts": {
    "currentSha256": "891cdbf2b508ecafd259d4bf860b62ee2e2f326ea4e8b7ac3700a6305a10e854",
    "priorLoaderSha256": "b14a8b2a963e5843a68966b81f7e25c48f551f091b710b52c69c3ef7a19c1557",
    "added": "    for(const reason of ['sign-in','access-denied'] as const){\n      deliver({type:HEAD_SELECTION_PROTOCOL+'-ready',version:1,revision});\n      const retired=session();deliver(selected('brainstem-medulla',1));assert.equal(nav().comparisonReady,true);\n      deliver({type:HEAD_SELECTION_PROTOCOL,version:1,revision,session:retired,sequence:2,status:'blocked',reason});\n      assert.equal(nav().comparisonReady,false);assert.equal(nav().recoveryLinks,true);assert(fallback());\n      assert.match(status(),reason==='sign-in'?/Sign in to Visible Medicine/:/Access.*refused/);\n      assert.match(status(),/Guided playback is paused/);\n      deliver(selected('brainstem-medulla',3,retired));assert.equal(nav().comparisonReady,false,'retired session cannot resume playback');\n      deliver({type:HEAD_SELECTION_PROTOCOL+'-ready',version:1,revision:'0'.repeat(40)});assert.equal(session(),retired);\n      deliver({type:HEAD_SELECTION_PROTOCOL+'-ready',version:1,revision});assert.notEqual(session(),retired);\n      deliver(selected('brainstem-medulla',1));assert.equal(nav().comparisonReady,true);\n    }\n"
  },
  "head-live-model.test.ts": {
    "currentSha256": "d94226df01904a99edf5fcab248fff0c39c5ce1227b7748bfd95b5a582a79554",
    "priorLoaderSha256": "3e288203f8ba97cf211194e3e90a3de67c88f535b8ee6433d650128a395b7ed3",
    "added": "    // Additional advisory resource causes revoke the same live-selection authority.\n    for(const reason of ['sign-in','access-denied'] as const){\n      frame.props.onLoad();flush();const retired=session();\n      deliver({type:protocol,version:1,revision,session:retired,sequence:1,status:'blocked',reason});\n      assert.equal(nav().liveState,reason);assert.equal(nav().conceptId,null);assert.equal(teachingNode(),undefined);\n      deliver(selected(retired,2,selection));assert.equal(nav().liveState,reason,'old session cannot clear an access refusal');\n      nav().onRetry();flush();const fresh=session();assert.notEqual(fresh,retired);\n      deliver(selected(retired,3,selection));assert.equal(nav().liveState,'connecting');\n      deliver(selected(fresh,1,selection));assert.equal(nav().conceptId,pons.conceptId);assert.equal(nav().liveState,'ready');\n    }\n"
  }
};
export function restoreConsumerAccessLaterRole(name,text){
  const role=roles[name];
  if(!role)return text;
  assert.equal(sha(text),role.currentSha256,name+' authenticated complete current access role');
  assert(!text.includes('\r'),name+' exact LF source');
  assert.equal(text.split(role.added).length,2,name+' one exact additive access block');
  const prior=text.replace(role.added,'');
  assert.equal(sha(prior),role.priorLoaderSha256,name+' complete pre-access loader role');
  assert.equal(prior.replace(role.added,''),prior,name+' no second access block');
  return prior;
}

