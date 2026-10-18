'use client';
import {useEffect,useRef,type ReactNode} from 'react';
import {usePathname} from 'next/navigation';
import {createHeadFolderSession,isHeadFolderSessionRoute} from '../lib/head-folder-session';
import {HEAD_MANIFEST_SHA256} from '../lib/head-atlas-import';
import {HeadFolderSessionContext} from './HeadFolderSessionContext';

export function HeadFolderSessionProvider({children}:{children:ReactNode}){
  const pathname=usePathname();
  const session=useRef<ReturnType<typeof createHeadFolderSession>|null>(null);
  if(!session.current)session.current=createHeadFolderSession(HEAD_MANIFEST_SHA256);
  const value=session.current;
  useEffect(()=>{if(!isHeadFolderSessionRoute(pathname))value.clear();},[pathname,value]);
  useEffect(()=>{
    const clear=()=>value.clear();
    window.addEventListener('pagehide',clear);
    return()=>{window.removeEventListener('pagehide',clear);clear();};
  },[value]);
  return <HeadFolderSessionContext.Provider value={value}>{children}</HeadFolderSessionContext.Provider>;
}
