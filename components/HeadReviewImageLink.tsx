import type {ReactNode} from 'react';
import {headImageHref} from '../lib/head-atlas-navigation';

/** Resolve a Review image target against the exact verified head manifest. */
export function HeadReviewImageLink({conceptId,modality,revision,children}:{conceptId:string;modality:'CT'|'MRI';revision:string;children:ReactNode}){
  const href=headImageHref(modality,conceptId,null,revision);
  return href?<a href={href}>{children}</a>:<span>{children} (target unavailable for this head revision)</span>;
}
