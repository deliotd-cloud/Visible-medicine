type IndexKeyEvent = {
  key:string; altKey?:boolean; ctrlKey?:boolean; metaKey?:boolean; shiftKey?:boolean;
  nativeEvent?:{isComposing?:boolean}; target:EventTarget|null; currentTarget:HTMLElement;
  preventDefault:()=>void; stopPropagation:()=>void;
};

/** Focus-only index navigation. Enter/Space keep their native button activation.
 * Never selects anatomy, moves a scan cursor, or scrolls the surrounding page.
 */
export function headIndexKey(event:IndexKeyEvent):void {
  if(event.altKey||event.ctrlKey||event.metaKey||event.shiftKey||event.nativeEvent?.isComposing)return;
  const root=event.currentTarget,search=root.querySelector<HTMLInputElement>('[data-head-index-search]');
  const list=root.querySelector<HTMLElement>('[data-head-index-list]');
  if(!search||search.disabled||!list)return;
  const entries=Array.from(list.querySelectorAll<HTMLButtonElement>('[data-head-index-entry]')).filter(button=>!button.disabled);
  const index=entries.findIndex(button=>button===event.target);
  let destination:HTMLElement|undefined;
  if(event.target===search){
    if(event.key==='ArrowDown')destination=entries[0];
    if(event.key==='ArrowUp')destination=entries.at(-1);
  }else if(index>=0){
    if(event.key==='Escape')destination=search;
    if(event.key==='ArrowDown')destination=entries[Math.min(index+1,entries.length-1)];
    if(event.key==='ArrowUp')destination=entries[Math.max(0,index-1)];
    if(event.key==='Home')destination=entries[0];
    if(event.key==='End')destination=entries.at(-1);
  }
  if(!destination)return;
  event.preventDefault();event.stopPropagation();destination.focus({preventScroll:true});
  if(destination===search)return;
  const bounds=list.getBoundingClientRect(),item=destination.getBoundingClientRect();
  const top=bounds.top+list.clientTop,bottom=top+list.clientHeight;
  if(item.top<top)list.scrollTop+=item.top-top;
  else if(item.bottom>bottom)list.scrollTop+=Math.min(item.bottom-bottom,item.top-top);
}

/** One Tab stop in the current filtered results, without selecting anatomy.
 * The caller discards focused IDs from a different loaded study.
 */
export function headIndexTabStop(ids:readonly string[],focusedId?:string|null,selectedId?:string|null):string|undefined{
  return ids.find(id=>id===focusedId)??ids.find(id=>id===selectedId)??ids[0];
}
