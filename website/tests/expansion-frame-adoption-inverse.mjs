import assert from 'node:assert/strict';
import {restorePreKeyboardHelp} from './keyboard-help-source-inverse.mjs';

const once=(source,added,original='')=>{
  assert.equal(source.split(added).length,2,`exact expansion seam missing or repeated: ${added.slice(0,60)}`);
  return source.replace(added,original);
};

export function restorePreExpansionFrame(source){
  let restored=restorePreKeyboardHelp(source);
  restored=once(restored,"import {createAtlasRuntimeExpansion, type AtlasExpansionState} from './atlas-runtime-expansion';\n");
  restored=once(restored,`  const expandButton = useRef<HTMLButtonElement>(null);
  const expansion = useRef<ReturnType<typeof createAtlasRuntimeExpansion> | null>(null);
  const [expandState,setExpandState] = useState<AtlasExpansionState>({active:false,pending:false,message:null});
`);
  restored=once(restored,`  useEffect(() => {
    const owner=container.current;
    if(!allowFullScreen||!owner)return;
    let wasOwned=document.fullscreenElement===owner;
    const controller=createAtlasRuntimeExpansion({owner,doc:document,frame:frame.current,change:next=>{
      if(wasOwned&&!next.active&&!document.fullscreenElement){
        queueMicrotask(()=>{
          // Escape may return focus to the page body. Never displace a user's
          // intervening focus choice or focus a retired source's control.
          if(expansion.current===controller&&document.activeElement===document.body&&
            expandButton.current?.isConnected)expandButton.current.focus({preventScroll:true});
        });
      }
      wasOwned=next.active;
      setExpandState(next);
    }});
    expansion.current=controller;
    return()=>{
      if(expansion.current===controller)expansion.current=null;
      controller.retire();
    };
  },[allowFullScreen]);

`);
  restored=once(restored,'    expansion.current?.refreshFrame(event.currentTarget);\n');
  restored=once(restored,`    <div className="atlas-runtime-host-tools">
      {allowFullScreen&&<button ref={expandButton} className="atlas-runtime-expand" type="button"
        aria-pressed={expandState.active} disabled={expandState.pending}
        onClick={()=>expandState.active?expansion.current?.exit():expansion.current?.request()}>
        {expandState.active?'Restore viewer':'Expand viewer'}
      </button>}
      {phase === 'document' && <details className="atlas-runtime-help">
        <summary aria-label="Viewer help">Help</summary>
        <p>Blank, incomplete or showing an error? Retry the same source or open it in a new tab. Retrying resets the viewer's current view. Expand viewer keeps this 3D session in this tab; native Focus view only hides side panels.</p>
        {recoveryActions}
      </details>}
      {expandState.message&&<p className="atlas-runtime-expand-message" role="status" aria-live="polite">{expandState.message}</p>}
    </div>`, `    {phase === 'document' && <details className="atlas-runtime-help">
      <summary>Viewer help</summary>
      <p>Blank, incomplete or showing an error? Retry the same source or open it full screen. Retrying resets the viewer's current view.</p>
      {recoveryActions}
    </details>}`);
  return restored;
}
