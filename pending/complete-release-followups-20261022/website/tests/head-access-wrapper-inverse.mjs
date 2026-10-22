import assert from 'node:assert/strict';

// Reverses only the later, source-authenticated head access changes. The
// caller separately reverses body learning and the runtime-frame expansion,
// then compares every byte of each wrapper with its pinned original.
const once=(source,added,original='')=>{
  assert.equal(source.split(added).length,2,`exact head access seam missing or repeated: ${added.slice(0,80)}`);
  return source.replace(added,original);
};

export function restorePreHeadAccessWrapper(source,name){
  if(name==='AtlasRuntimeFrame')return source;
  if(name==='HeadAtlasLinkedModel')return once(source,
    "    if(next.status==='blocked'&&(next.reason==='sign-in'||next.reason==='access-denied'))session.current='';\n");
  assert.equal(name,'HeadAtlasGuidedModel');
  let restored=once(source,
    "type Status='connecting'|'waiting'|'ready'|'different'|'refused'|'practice'|'guided'|'unavailable'|'sign-in'|'access-denied';",
    "type Status='connecting'|'waiting'|'ready'|'different'|'refused'|'practice'|'guided'|'unavailable';");
  restored=once(restored,"        confirmedSource.current=null;\n");
  restored=once(restored,
    "        if(next.reason==='unavailable'||next.reason==='sign-in'||next.reason==='access-denied')session.current='';return;",
    "        if(next.reason==='unavailable')session.current='';return;");
  restored=once(restored,
    "  const notice=status==='ready'?'Model selection matches this step.':status==='practice'?historyPending?'Finish model practice to open the requested history step.':'Finish model practice before changing linked steps.':status==='guided'?historyPending?'Finish the in-model guide to open the requested history step.':'Finish the in-model guide before changing linked steps.':status==='different'?'The model selection differs from this tour step.':status==='connecting'?'Connecting to the model…':status==='waiting'?'Waiting for the model to select this step…':status==='sign-in'?'Sign in to Visible Medicine to load the required 3D model. Guided playback is paused; Atlas and imaging access are checked separately.':status==='access-denied'?'Access to the required 3D model was refused. Check your Atlas access with the site owner. Guided playback is paused; Atlas and imaging access are checked separately.':'This step cannot be focused in the current model view.';",
    "  const notice=status==='ready'?'Model selection matches this step.':status==='practice'?historyPending?'Finish model practice to open the requested history step.':'Finish model practice before changing linked steps.':status==='guided'?historyPending?'Finish the in-model guide to open the requested history step.':'Finish the in-model guide before changing linked steps.':status==='different'?'The model selection differs from this tour step.':status==='connecting'?'Connecting to the model…':status==='waiting'?'Waiting for the model to select this step…':'This step cannot be focused in the current model view.';");
  return once(restored,
    "recoveryLinks={!ready&&['unavailable','refused','different','sign-in','access-denied'].includes(status)}",
    "recoveryLinks={!ready&&(status==='unavailable'||status==='refused'||status==='different')}");
}
