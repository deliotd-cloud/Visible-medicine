import type {KeyboardEventHandler} from 'react';
import {headDisclosureKeyDown} from '../lib/head-disclosure-keyboard.ts';
// The exact changed JSX attribute must satisfy React's actual details-event type.
export const imageToolsHandler:KeyboardEventHandler<HTMLDetailsElement>=headDisclosureKeyDown;
export const imageToolsDetails=<details className="head-display-settings head-image-tools" onKeyDown={headDisclosureKeyDown}/>;
