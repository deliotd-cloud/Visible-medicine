'use client';

import type {ComponentPropsWithoutRef} from 'react';
import {headDisclosureKeyDown} from '../lib/head-disclosure-keyboard';

/** Native DOM and persistent children; Escape never submits or resets a form. */
export function NativeDisclosure({onKeyDown,...props}:ComponentPropsWithoutRef<'details'>){
 return <details {...props} onKeyDown={event=>{
  onKeyDown?.(event);
  headDisclosureKeyDown(event);
 }}/>;
}
