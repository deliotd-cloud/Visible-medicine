/** Reveal learning content within its own pane without scrolling the scan/page. */
export function focusHeadLearningContent(element:Pick<HTMLElement,'closest'|'focus'>|null):void{
  if(!element)return;
  element.closest('.imaging-workspace-info')?.scrollTo({top:0,behavior:'instant'});
  element.focus({preventScroll:true});
}

/** A one-use focus request for a committed guided step, including delayed study loads. */
export function createHeadLearningFocusLease(doc:Document,win:Window){
  const initial=doc.activeElement;
  let pending=true;
  const cancel=()=>{
    if(!pending)return;
    pending=false;
    doc.removeEventListener('focusin',onFocus,true);
    doc.removeEventListener('pointerdown',cancel,true);
    doc.removeEventListener('keydown',cancel,true);
    doc.removeEventListener('visibilitychange',cancel);
    win.removeEventListener('blur',cancel);
  };
  const onFocus=(event:Event)=>{if(event.target!==initial)cancel();};
  doc.addEventListener('focusin',onFocus,true);
  doc.addEventListener('pointerdown',cancel,true);
  doc.addEventListener('keydown',cancel,true);
  doc.addEventListener('visibilitychange',cancel);
  win.addEventListener('blur',cancel);
  try{if(doc.hidden||doc.visibilityState==='hidden'||!doc.hasFocus())cancel();}catch{cancel();}
  return {
    cancel,
    settle(target:HTMLElement|null):boolean{
      if(!pending)return false;
      let eligible=false;
      try{
        const style=target&&win.getComputedStyle(target);
        eligible=!!target&&target.isConnected&&target.ownerDocument===doc&&doc.activeElement===initial&&
          !doc.hidden&&doc.visibilityState!=='hidden'&&doc.hasFocus()&&
          !target.hidden&&!target.inert&&!target.closest('[hidden], [inert], [aria-hidden="true"]')&&
          (!target.getClientRects||target.getClientRects().length>0)&&
          (!style||style.display!=='none'&&style.visibility!=='hidden'&&style.visibility!=='collapse');
      }catch{eligible=false;}
      // Retire listeners before the intentional focusin event can fire.
      cancel();
      if(!eligible)return false;
      focusHeadLearningContent(target);
      return true;
    },
  };
}
