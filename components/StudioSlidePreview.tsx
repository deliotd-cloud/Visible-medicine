"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { readSlidePreviewImage, readSlidePreviewPackage, type PreviewLocalFile, type SlidePreviewManifest } from "../lib/lecture-slide-preview.ts";
import "./studio-slide-preview.css";

type Package = { generation: number; manifest: SlidePreviewManifest; images: Map<string, PreviewLocalFile> };
type ImageView = { generation: number; position: number; request: number; url: string; decoded: boolean };

/** Local, disposable review only. No course mutation, persistence or network request. */
export function StudioSlidePreview() {
  const [loaded, setLoaded] = useState<Package | null>(null);
  const [position, setPosition] = useState(0);
  const [image, setImage] = useState<ImageView | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const mounted = useRef(true);
  const packageRequest = useRef(0);
  const imageRequest = useRef(0);
  const current = useRef<Package | null>(null);
  const currentUrl = useRef<string | null>(null);

  function revokeImage() {
    if (currentUrl.current) URL.revokeObjectURL(currentUrl.current);
    currentUrl.current = null;
  }
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      packageRequest.current++;
      imageRequest.current++;
      current.current = null;
      revokeImage();
    };
  }, []);

  function clear() {
    if (!mounted.current) return;
    packageRequest.current++;
    imageRequest.current++;
    current.current = null;
    revokeImage();
    setLoaded(null); setImage(null); setPosition(0); setError(""); setBusy(false);
  }

  async function selectSlide(index: number, context: Package | null) {
    if (!mounted.current || !context || current.current !== context || !Number.isInteger(index) || index < 0 || index >= context.manifest.slides.length) return;
    const request = ++imageRequest.current;
    revokeImage(); setImage(null); setPosition(index); setError(""); setBusy(true);
    const slide = context.manifest.slides[index];
    const isCurrent = () => mounted.current && current.current === context && imageRequest.current === request;
    try {
      const file = context.images.get(slide.image.path);
      if (!file) throw new Error("The selected slide image is missing. Choose the complete preview folder again.");
      const bytes = await readSlidePreviewImage(file, slide.image);
      if (!isCurrent()) return;
      const url = URL.createObjectURL(new Blob([Uint8Array.from(bytes).buffer], { type: "image/png" }));
      currentUrl.current = url;
      setImage({ generation: context.generation, position: index, request, url, decoded: false });
    } catch {
      if (isCurrent()) setError("This slide could not be verified. Check the image and its source manifest, then choose the folder again.");
    } finally {
      if (isCurrent()) setBusy(false);
    }
  }

  async function chooseFolder(files: FileList | null) {
    if (!mounted.current || !files?.length) return;
    clear();
    const request = ++packageRequest.current;
    setBusy(true);
    try {
      if (files.length > 501) throw new Error("Choose a preview with at most 500 slides.");
      const result = await readSlidePreviewPackage(Array.from(files));
      if (!mounted.current || packageRequest.current !== request) return;
      const next = { ...result, generation: request };
      current.current = next;
      setLoaded(next);
      await selectSlide(0, next);
    } catch {
      if (mounted.current && packageRequest.current === request) {
        setError("Could not open this preview. Choose the folder containing preview.json and its complete slides folder. Only bounded, source-pinned PNG previews are supported.");
      }
    } finally {
      if (mounted.current && packageRequest.current === request && !current.current) setBusy(false);
    }
  }

  function keyboard(event: KeyboardEvent<HTMLElement>) {
    if (!loaded || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.target !== event.currentTarget) return;
    const index = event.key === "ArrowRight" ? position + 1 : event.key === "ArrowLeft" ? position - 1 : event.key === "Home" ? 0 : event.key === "End" ? loaded.manifest.slides.length - 1 : null;
    if (index === null) return;
    event.preventDefault();
    void selectSlide(index, loaded);
  }

  const slide = loaded?.manifest.slides[position];
  const visibleImage = loaded && image?.generation === loaded.generation && image.position === position ? image : null;
  const title = slide?.title || `Slide ${position + 1}`;
  function settleImage(view: ImageView, decoded: boolean) {
    if (!mounted.current || current.current?.generation !== view.generation || imageRequest.current !== view.request || currentUrl.current !== view.url) return;
    if (decoded) setImage({ ...view, decoded: true });
    else { revokeImage(); setImage(null); setError("The verified PNG could not be displayed by this browser. No slide was accepted or imported."); }
  }

  return <section className="studio-slide-preview" aria-labelledby="slide-preview-title">
    <div className="slide-preview-intake">
      <div><h2 id="slide-preview-title">Preview original slides</h2><p>Choose a prepared preview folder from this computer. Files stay in this tab. Nothing is uploaded, saved to a course, approved or published.</p></div>
      <label className="slide-preview-picker"><span>Choose local preview folder</span><input type="file" multiple ref={element => { element?.setAttribute("webkitdirectory", ""); }} aria-describedby="slide-preview-help" onChange={event => { void chooseFolder(event.currentTarget.files); event.currentTarget.value = ""; }} /></label>
      <button type="button" onClick={clear} disabled={!loaded && !busy && !error}>Clear preview</button>
    </div>
    <p id="slide-preview-help" className="slide-preview-help">A preview folder contains preview.json and slides/*.png, generated from an exact PowerPoint revision. A PowerPoint file alone is not supported here. Rendering may differ from PowerPoint, and animations are not played.</p>
    <p role="status" aria-live="polite" className="slide-preview-status">{busy ? "Checking local preview…" : error ? "Review only. Preview unavailable." : visibleImage?.decoded ? `Slide ${position + 1} of ${loaded!.manifest.slides.length}. Image bytes verified. Review only.` : loaded ? "Review only. Waiting for the slide image to display." : "No preview selected."}</p>
    {error && <p role="alert" className="slide-preview-error">{error}</p>}
    {loaded && slide && <>
      <nav className="slide-preview-controls" aria-label="Presentation slide navigation">
        <button type="button" disabled={position === 0} onClick={() => { void selectSlide(position - 1, loaded); }}>Previous slide</button>
        <label><span>Slide</span><select value={position} onChange={event => { void selectSlide(Number(event.target.value), loaded); }}>{loaded.manifest.slides.map((entry, index) => <option key={entry.part} value={index}>{entry.position}. {entry.title || "Untitled source slide"}</option>)}</select></label>
        <button type="button" disabled={position === loaded.manifest.slides.length - 1} onClick={() => { void selectSlide(position + 1, loaded); }}>Next slide</button>
      </nav>
      <figure className="slide-preview-canvas" tabIndex={0} onKeyDown={keyboard} aria-label="Slide canvas. Use left and right arrows, Home or End to navigate.">
        {visibleImage ? <img key={visibleImage.url} src={visibleImage.url} width={slide.image.width} height={slide.image.height} alt={`Source slide ${position + 1}: ${title}. See original notes below. A complete accessible description still requires review.`} onLoad={() => settleImage(visibleImage, true)} onError={() => settleImage(visibleImage, false)} /> : <p>{error ? "Slide unavailable" : "Checking slide image…"}</p>}
        <figcaption>{position + 1} / {loaded.manifest.slides.length} · {title}</figcaption>
      </figure>
      <details className="slide-preview-notes"><summary>Original speaker notes</summary><pre>{slide.notes || "No speaker notes in this source slide."}</pre></details>
      <details className="slide-preview-provenance"><summary>Source and review requirements</summary><dl>
        <dt>Presentation</dt><dd>{loaded.manifest.source.label}</dd>
        <dt>Original file SHA-256</dt><dd><code>{loaded.manifest.source.sha256}</code></dd>
        <dt>Intake SHA-256</dt><dd><code>{loaded.manifest.intakeSha256}</code></dd>
        <dt>Slide anchor</dt><dd><code>{loaded.manifest.source.sha256}:{slide.part}</code></dd>
        <dt>Source slide XML SHA-256</dt><dd><code>{slide.partSha256}</code></dd>
        <dt>Image SHA-256</dt><dd><code>{slide.image.sha256}</code></dd>
        <dt>Renderer</dt><dd>{loaded.manifest.renderer.name} · {loaded.manifest.renderer.version}</dd>
      </dl><p>These hashes identify the selected source claims and displayed image bytes. They do not prove visual fidelity, licensing, privacy clearance, accessibility or clinical approval. Original animations, editable objects and source citations must be reviewed before course admission. No anatomical links are assigned automatically.</p></details>
    </>}
  </section>;
}
