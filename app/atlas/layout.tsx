import type {ReactNode} from 'react';
import {HeadFolderSessionProvider} from '../../components/HeadFolderSessionProvider';

export default function AtlasLayout({children}:{children:ReactNode}){
  return <HeadFolderSessionProvider>{children}</HeadFolderSessionProvider>;
}
