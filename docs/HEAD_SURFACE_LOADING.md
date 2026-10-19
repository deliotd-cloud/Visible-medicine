# Deferred native head surface renderer

CT/MRI head anatomy initially opens in the existing axial slice layout. The WebGL/Three.js renderer is no longer an eager import of `HeadAtlasViewer`: `HeadAtlasSurfaceLoader` requests it only when a selected native surface or locator is visible in 3D or Multiplanar.

## Preserved behaviour

The existing surface and regional-centreline rendering functions were moved without changing geometry construction, disposal, native RAS coordinates, picking or colour. The Canvas camera, lighting, fit bounds and damped orbit controls remain unchanged. No second affine or generic-Atlas registration is introduced. The parent retains the existing selection, local import, source limits and active-question concealment.

The loader announces opening, gives an explicit import-failure message with **Retry 3D view**, and ignores obsolete or unmounted import completions. A prop change while the module opens forwards the latest selection/callback after completion, rather than a captured earlier selection. Switching back to slices unmounts the surface but does not unload an already evaluated JavaScript module from the browser cache. A retry cannot guarantee recovery from every browser-cached module or GPU failure; this is not a new WebGL error boundary.

## Verification and limits

The focused hook tests cover deferred loading, current props, import failure/retry, late success/failure after unmount and cleanup/setup replay. The viewer tests cover closed/unselected, axial, Multiplanar, practice, clearing and closing mount conditions. A normalized source comparison binds both moved geometry functions to the previous checkpoint. Build-manifest and scan-free network observations check the actual bundle boundary; local timings are lab observations, not real-user performance guarantees.

The verified local build changes the head-viewer chunk from 968,199 to 68,132 raw bytes (locally gzipped: 258,548 to 21,743). Its static dependency closure changes from 1,340,783 to 439,060 raw bytes. These are bundle sizes, not total-page payload or field transfer measurements. The scan-free initial network and CT/MRI server-rendered HTML do not request/preload the separate native surface chunk. Single unthrottled localhost reload traces recorded LCP 365 ms before and 381 ms after, CLS 0.02 and 0.00 respectively; they establish no latency improvement, INP result or causation.

The 1280px native CT smoke check selects the saved Pons in axial view without a rotatable Canvas, opens the labelled 3D Canvas, returns to axial, restores three slices plus surface in Multiplanar, and hides the surface during practice. No horizontal overflow, page scrolling or console errors were observed. Native scan/surface frames were neither saved nor emitted; the final proof is the closed scan-free import page. MRI uses the same extracted renderer and has HTTP/source-link coverage, not a new native MRI GPU acceptance run.

Use the existing pinned approved local package for native rendering checks. Never place its image, mask, surface or manifest bytes in the preview build, Git or screenshots. Keep native rendering observations separate from source-only evidence and clinical acceptance. The E-drive checkpoint records exact source/build hashes, measured bundle sizes, browser observations and known limits.

No dependencies, fonts, assets, source datasets, accepted masks, access rules or desktop clinical PACS were changed. Effect cleanup follows the [React useEffect reference](https://react.dev/reference/react/useEffect); client-only loading does not confer source approval or spatial synchronization.
