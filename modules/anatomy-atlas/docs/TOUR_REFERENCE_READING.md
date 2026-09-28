# Guided-tour reference reading

Opening References in the shoulder tour or References & limits in a regional
tour pauses autoplay and camera movement through the existing reading-pause
path. Closing the disclosure never resumes the tour; Play resumes explicitly.
No new control, source teaching, geometry, asset or entitlement is added.

The shoulder defect was reproduced in the website importing Atlas `548aa09`:
after Start and Play, the References disclosure was open while Pause remained
visible, proving playback was still active. Regional references receive their
own opening handler so reading does not depend on outer-disclosure event
propagation. Imaging-note and quick-check pause behaviour remain unchanged.

`npm run tour-reading:test` exercises actual component handlers and session
timers, reading closure, explicit resume, loading/visibility recovery, source
integrity and smooth/reduced-motion camera behaviour. Browser verification and
exact recovery evidence are recorded in the coordination checkpoint. These are
interaction checks, not clinical approval or a full assistive-device audit.
