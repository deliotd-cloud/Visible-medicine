export type AtlasExpansionState={active:boolean;pending:boolean;message:string|null};

/** Fullscreen belongs only to this mounted host; no iframe navigation or remount. */
export function createAtlasRuntimeExpansion({owner,doc,frame,change}:{
  owner:HTMLElement;
  doc:Document;
  frame?:HTMLIFrameElement|null;
  change:(state:AtlasExpansionState)=>void;
}){
  let active=doc.fullscreenElement===owner;
  let pending=false;
  let message:string|null=null;
  let retired=false;
  let frameElement=frame??null;
  let frameDocument:Document|null=null;
  let parentKeyBound=false;
  const onEscape=(event:KeyboardEvent)=>{
    if(event.key!=='Escape'||event.defaultPrevented||event.isComposing||event.repeat)return;
    // Let later bubble listeners consume Escape for native menus first.
    queueMicrotask(()=>{
      if(!retired&&!event.defaultPrevented&&!event.isComposing&&!event.repeat&&
        doc.fullscreenElement===owner)requestExit();
    });
  };
  const detachKeys=()=>{
    if(parentKeyBound){doc.removeEventListener('keydown',onEscape);parentKeyBound=false;}
    if(frameDocument){frameDocument.removeEventListener('keydown',onEscape);frameDocument=null;}
  };
  const refreshFrame=(next:HTMLIFrameElement|null=frameElement)=>{
    frameElement=next;
    if(frameDocument){frameDocument.removeEventListener('keydown',onEscape);frameDocument=null;}
    if(retired||!active)return;
    try{
      const nextDocument=frameElement?.contentDocument;
      if(nextDocument&&nextDocument!==doc){
        nextDocument.addEventListener('keydown',onEscape);
        frameDocument=nextDocument;
      }
    }catch{/* Cross-origin frames retain keyboard Restore viewer. */}
  };
  const emit=()=>{if(!retired)change({active,pending,message});};
  const sync=()=>{
    if(retired)return;
    active=doc.fullscreenElement===owner;
    if(active)message=null;
    if(active){
      if(!parentKeyBound){doc.addEventListener('keydown',onEscape);parentKeyBound=true;}
      refreshFrame();
    }else detachKeys();
    emit();
  };
  const failed=(event?:Event)=>{
    if(retired||!pending)return;
    if(event?.target&&event.target!==owner&&event.target!==doc)return;
    pending=false;
    message='The browser could not change the viewer display. You can still open this source in a new tab.';
    active=doc.fullscreenElement===owner;
    emit();
  };
  doc.addEventListener('fullscreenchange',sync);
  doc.addEventListener('fullscreenerror',failed);
  const exitOwned=()=>{
    if(doc.fullscreenElement!==owner)return;
    try{void doc.exitFullscreen?.().catch(()=>{});}catch{/* Cleanup is best effort. */}
  };
  const settle=(action:Promise<void>)=>{
    void action.then(()=>{
      if(retired){
        exitOwned();
        return;
      }
      pending=false;
      emit();
    },failed);
  };
  function requestExit(){
    if(retired||pending)return;
    if(doc.fullscreenElement!==owner){sync();return;}
    if(typeof doc.exitFullscreen!=='function'){
      message='The browser could not restore this viewer. Press Escape to leave full screen.';
      emit();return;
    }
    pending=true;message=null;emit();
    try{settle(Promise.resolve(doc.exitFullscreen()));}catch{failed();}
  }
  sync();
  return {
    get state():AtlasExpansionState{return {active,pending,message};},
    refreshFrame,
    request(){
      if(retired||pending||active)return;
      if(doc.fullscreenEnabled===false||typeof owner.requestFullscreen!=='function'){
        message='Same-tab expansion is unavailable in this browser. You can still open this source in a new tab.';
        emit();return;
      }
      if(doc.fullscreenElement&&doc.fullscreenElement!==owner){
        message='Another view is already full screen. Restore it before expanding this viewer.';
        emit();return;
      }
      pending=true;message=null;emit();
      try{settle(Promise.resolve(owner.requestFullscreen()));}catch{failed();}
    },
    exit:requestExit,
    retire(){
      if(retired)return;
      retired=true;
      doc.removeEventListener('fullscreenchange',sync);
      doc.removeEventListener('fullscreenerror',failed);
      detachKeys();
      exitOwned();
    },
  };
}
