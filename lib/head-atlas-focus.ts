/** Reveal learning content within its own pane without scrolling the scan/page. */
export function focusHeadLearningContent(element:Pick<HTMLElement,'closest'|'focus'>|null):void{
  if(!element)return;
  element.closest('.imaging-workspace-info')?.scrollTo({top:0,behavior:'instant'});
  element.focus({preventScroll:true});
}
