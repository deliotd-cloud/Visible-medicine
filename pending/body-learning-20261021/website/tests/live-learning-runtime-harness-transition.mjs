/** Add the actual child component's hook and event surface to the deterministic harness. */
export const liveLearningHookExports={
  react:'export const useState=(...a)=>globalThis.__atlasHooks.useState(...a); export const useRef=(...a)=>globalThis.__atlasHooks.useRef(...a); export const useEffect=(...a)=>globalThis.__atlasHooks.useEffect(...a); export const useLayoutEffect=(...a)=>globalThis.__atlasHooks.useLayoutEffect(...a); export const useMemo=(...a)=>globalThis.__atlasHooks.useMemo(...a);',
  jsx:'export const jsx=(...a)=>globalThis.__atlasHooks.jsx(...a); export const jsxs=jsx; export const Fragment=Symbol.for("react.fragment");',
};
const same=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((v,i)=>Object.is(v,b[i]));

export function attachLiveLearningHooks(hooks,getCurrent){
  hooks.useMemo=(create,deps)=>{
    const cell=hooks.useRef(null);
    if(!cell.current||!same(cell.current.deps,deps))cell.current={deps,value:create()};
    return cell.current.value;
  };
  hooks.useLayoutEffect=(create,deps)=>{
    const instance=getCurrent(),index=instance.cursor++;
    const old=instance.effects.get(index);
    if(old&&same(deps,old.deps))return;
    old?.cleanup?.();
    instance.pending.push({index,create,deps,kind:'layout'});
  };
}

function listenable(target){
  const listeners=new Map();
  target.addEventListener=(type,callback)=>{
    let values=listeners.get(type);if(!values)listeners.set(type,values=new Set());values.add(callback);
  };
  target.removeEventListener=(type,callback)=>listeners.get(type)?.delete(callback);
  target.dispatchEvent=(event)=>{for(const callback of listeners.get(event.type)||[])callback(event);};
  return target;
}
export function attachLiveLearningBrowser(win,doc){
  doc.hidden=false;
  listenable(doc);listenable(win);
  win.location.origin=new URL(win.location.href).origin;
}
export function attachLiveLearningFrame(frame,src,doc){
  frame.isConnected=true;frame.ownerDocument=doc;
  frame.getAttribute=name=>name==='src'?src:null;
  listenable(frame);
}
