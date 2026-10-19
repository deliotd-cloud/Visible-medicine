/** Close only the focused, live innermost disclosure. No viewer state is touched. */
export type HeadDisclosureKeyEvent={
 key:string;
 defaultPrevented:boolean;
 nativeEvent?:{isComposing?:boolean;keyCode?:number};
 currentTarget:HTMLDetailsElement;
 target:EventTarget|null;
 preventDefault():void;
 stopPropagation():void;
};

export function headDisclosureKeyDown(event:HeadDisclosureKeyEvent):boolean{
 if(event.key!=='Escape'||event.defaultPrevented||event.nativeEvent?.isComposing||event.nativeEvent?.keyCode===229)return false;
 const details=event.currentTarget;
 if(!details.isConnected||!details.open)return false;
 const nearest=(event.target as Element|null)?.closest?.('details');
 if(nearest!==details)return false;
 const summary=details.querySelector<HTMLElement>(':scope > summary');
 if(!summary?.isConnected)return false;
 event.preventDefault();event.stopPropagation();
 details.open=false;
 summary.focus({preventScroll:true});
 return true;
}
