import React from 'react';
import {createRoot} from 'react-dom/client';
import FdaShoulderReference from '../atlas/app/fda-shoulder-reference';
const query=new URLSearchParams(location.search);
createRoot(document.getElementById('app')!).render(<FdaShoulderReference expectedRevision={query.get('revision')??undefined} selectedId={query.get('structure')??undefined}/>);
