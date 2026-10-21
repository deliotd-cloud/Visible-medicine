# Anatomical model keyboard zoom

Focus the 3D model with Tab, then use `+` or `=` to zoom in and `-` to zoom out. Arrow keys keep their existing rotation behaviour; in a planar structure tray they pan instead. Shift keeps the existing fine arrow movement. Existing zoom and view buttons remain available. Control/Command/Alt shortcuts, text inputs and normal page navigation are not intercepted.

Zoom is camera scale only. It does not change anatomical surfaces, select another structure, imply physical measurement, move an acquired scan or create spatial registration. The target and viewing direction stay unchanged. The renderer's existing distance/zoom limits apply. Locked guided-tour cameras do not accept these keys; the shared ordinary anatomical FittedCamera opts in for perspective and planar views. Separate native CT/MRI surface cameras and the desktop clinical PACS are not modified.

The existing renderer revision inputs include both affected runtime files, `lib/camera-keyboard.ts` and `app/fitted-camera.tsx`. The camera-keyboard package alias runs the complete original keyboard suite, the new zoom suite and the original guided-camera interruption check. No new package, model, texture, image, font, service or mandatory fee is introduced.

Focused software evidence is not browser/GPU, clinical or whole-platform approval. Preserve revision-bound review and use the normal source/export/Website integration pipeline before delivery.
