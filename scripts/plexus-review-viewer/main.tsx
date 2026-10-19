import React from 'react';
import {createRoot} from 'react-dom/client';
import {OriginalPlexusViewer} from 'vm-plexus-viewer';
import 'vm-plexus-css';
import './frame.css';
createRoot(document.getElementById('plexus-root')!).render(<>
  <header className="plexus-packet-heading"><strong>Original brachial plexus schematic</strong><span>Right · typical C5–T1 · 35 parts / 38 named connections</span>
    <p>Illustrative diagram, arbitrary units. Not a spatial nerve mesh, patient registration or learner-approved model.</p></header>
  <OriginalPlexusViewer/>
  <footer className="plexus-packet-footer">MIT-authored procedural diagram. <a href={'./THIRD_PARTY_NOTICES.txt'+window.location.search}>Licences and notices</a> · Review decisions are made in the surrounding Clinical Review worksheet, not this diagram.</footer>
</>);
