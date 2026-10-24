export type HeadPracticeLinkInput={
  currentHref:string;
  href:string;
  target?:string;
  download?:boolean;
  button:number;
  defaultPrevented:boolean;
  metaKey?:boolean;
  ctrlKey?:boolean;
  shiftKey?:boolean;
  altKey?:boolean;
};

/** Whether an ordinary link click would replace the current document. */
export function shouldConfirmHeadPracticeLink(input:HeadPracticeLinkInput):boolean{
  if(input.defaultPrevented||input.button!==0||input.download||
    input.metaKey||input.ctrlKey||input.shiftKey||input.altKey)return false;

  const target=input.target?.toLowerCase()??'';
  if(target!==''&&target!=='_self'&&target!=='_top'&&target!=='_parent')return false;

  try{
    const current=new URL(input.currentHref);
    const destination=new URL(input.href,current);
    if(!['http:','https:'].includes(current.protocol)||
      !['http:','https:'].includes(destination.protocol))return false;
    return destination.origin!==current.origin||
      destination.pathname!==current.pathname||
      destination.search!==current.search;
  }catch{
    return false;
  }
}
