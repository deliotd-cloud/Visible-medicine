'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { BrandLockup } from './BrandLockup';
import { EducationQuestionResponse } from './EducationQuestionResponse';
import { FractureCaseResponse } from './FractureCaseResponse';
import { parse, sha, type FracturePackage } from '../lib/fracture-package.mjs';
import type { FractureAnswer, FractureWorkbook, FractureWorkbookDetail, StoredFractureCase } from '../lib/fracture-workbooks';

const API = '/api/education/fracture-workbooks';
type ApiBody = { error?: string; workbooks: FractureWorkbook[]; workbook: FractureWorkbookDetail; answer: FractureAnswer; current?: FractureAnswer };
type LocalPackage = { raw: string; payload: FracturePackage };

function RasterViewport({ image, workbookId, context, localImage }: { image: StoredFractureCase['images'][number]; workbookId: string; context: string; localImage?: string }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [invert, setInvert] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  useEffect(() => {
    let active = true, objectUrl = '';
    const abort = new AbortController();
    setUrl(''); setError('');
    void (async () => {
      try {
        let bytes: Uint8Array<ArrayBuffer>;
        if (localImage) bytes = Uint8Array.from(atob(localImage), c => c.charCodeAt(0));
        else {
          const response = await fetch(`${API}?id=${encodeURIComponent(workbookId)}&image=${encodeURIComponent(image.id)}`, { cache: 'no-store', signal: abort.signal });
          if (!response.ok || response.headers.get('X-Fracture-Context') !== context) throw new Error('Image unavailable. Check your access and retry.');
          bytes = new Uint8Array(await response.arrayBuffer());
        }
        if (await sha(bytes) !== image.sha256) throw new Error('Image integrity check failed.');
        if (!active) return;
        objectUrl = URL.createObjectURL(new Blob([bytes], { type: 'image/png' }));
        setUrl(objectUrl);
      } catch (e) { if (active) setError(e instanceof Error ? e.message : 'Unable to load image.'); }
    })();
    const clear = () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
    window.addEventListener('pagehide', clear);
    return () => { active = false; abort.abort(); clear(); window.removeEventListener('pagehide', clear); };
  }, [image.id, image.sha256, workbookId, context, localImage, retry]);
  const fit = () => { setZoom(1); setPan({ x: 0, y: 0 }); };
  return <div className="fracture-raster">
    <div className="fracture-image-stage" tabIndex={0} role="region" aria-label={`${image.view || 'Radiograph'} image. Drag to pan; use the zoom controls below.`}
      onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y }; }}
      onPointerMove={e => { if (drag.current) setPan({ x: drag.current.px + e.clientX - drag.current.x, y: drag.current.py + e.clientY - drag.current.y }); }}
      onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}
      onKeyDown={e => { if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) { e.preventDefault(); setPan(p => ({ x: p.x + (e.key === 'ArrowLeft' ? -20 : e.key === 'ArrowRight' ? 20 : 0), y: p.y + (e.key === 'ArrowUp' ? -20 : e.key === 'ArrowDown' ? 20 : 0) })); } }}>
      {url ? <img src={url} alt={`${image.view || 'Unspecified view'}${image.laterality ? ` · ${image.laterality}` : ''}`} draggable={false}
        onError={() => setError('The image could not be decoded.')}
        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, filter: `brightness(${brightness}%) contrast(${contrast}%) invert(${invert ? 1 : 0})` }} /> : <p role="status">{error || 'Loading image…'}</p>}
      {error && <button className="secondary-button" onClick={() => setRetry(n => n + 1)}>Retry image</button>}
    </div>
    <div className="fracture-viewer-tools" aria-label="Image tools">
      <button onClick={() => setZoom(v => Math.max(.25, v / 1.25))} aria-label="Zoom out">−</button><output>{Math.round(zoom * 100)}%</output><button onClick={() => setZoom(v => Math.min(8, v * 1.25))} aria-label="Zoom in">+</button>
      <button onClick={fit}>Fit</button><button aria-pressed={invert} onClick={() => setInvert(v => !v)}>Invert</button>
      <button onClick={() => { fit(); setBrightness(100); setContrast(100); setInvert(false); }}>Reset</button>
      <label>Brightness<input type="range" min="25" max="200" value={brightness} onChange={e => setBrightness(Number(e.target.value))} /></label>
      <label>Contrast<input type="range" min="25" max="250" value={contrast} onChange={e => setContrast(Number(e.target.value))} /></label>
    </div>
  </div>;
}

export function FractureEducationWorkspace() {
  const [catalog, setCatalog] = useState<FractureWorkbook[]>([]);
  const [workbook, setWorkbook] = useState<FractureWorkbookDetail | null>(null);
  const [local, setLocal] = useState<LocalPackage | null>(null);
  const [caseIndex, setCaseIndex] = useState(0);
  const [imageIndex, setImageIndex] = useState(0);
  const [title, setTitle] = useState('Fracture review');
  const [privacy, setPrivacy] = useState(false), [reuse, setReuse] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [ready, setReady] = useState(false), [context, setContext] = useState('');
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Record<string, FractureAnswer>>({});
  const [pendingCount, setPendingCount] = useState(0);
  const [conflicts, setConflicts] = useState<Record<string, FractureAnswer>>({});
  const conflictRef = useRef(new Map<string, FractureAnswer>());
  const [saveStatus, setSaveStatus] = useState('All changes saved');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const pending = useRef(new Map<string, string>()), revisions = useRef(new Map<string, number>());
  const saving = useRef(new Set<string>()), timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generation = useRef(0), alive = useRef(true);
  const contextRef = useRef('');
  const loadCatalog = useCallback(async () => {
    const res = await fetch(API, { cache: 'no-store' });
    const body = await res.json() as ApiBody;
    if (!res.ok) throw new Error(body.error || 'Unable to load workbooks.');
    const token = res.headers.get('X-Fracture-Context') || '';
    contextRef.current = token; setContext(token); setCatalog(body.workbooks); setReady(true);
    return body.workbooks as FractureWorkbook[];
  }, []);
  const openWorkbook = useCallback(async (id: string) => {
    if (pending.current.size || saving.current.size) { setError('Save your pending answers before changing workbooks.'); return; }
    const current = ++generation.current;
    setBusy(true); setError('');
    try {
      const res = await fetch(`${API}?id=${encodeURIComponent(id)}`, { cache: 'no-store' });
      const body = await res.json() as ApiBody;
      if (!res.ok || res.headers.get('X-Fracture-Context') !== contextRef.current) throw new Error(body.error || 'Your account changed. Reload the workspace.');
      if (!alive.current || current !== generation.current) return;
      const detail = body.workbook as FractureWorkbookDetail;
      setWorkbook(detail); setLocal(null); setCaseIndex(0); setImageIndex(0); setImportOpen(false);
      setResponses(Object.fromEntries(detail.answers.map(a => [a.questionId, a.response])));
      setSaved(Object.fromEntries(detail.answers.map(a => [a.questionId, a])));
      revisions.current = new Map(detail.answers.map(a => [a.questionId, a.revision]));
      setSaveStatus('All changes saved');
      const url = new URL(window.location.href); url.searchParams.set('workbookId', id); window.history.replaceState(null, '', url);
    } catch (e) { if (current === generation.current) setError(e instanceof Error ? e.message : 'Unable to load workbook.'); }
    finally { if (current === generation.current) setBusy(false); }
  }, []);
  useEffect(() => {
    alive.current = true;
    void loadCatalog().then(rows => { const id = new URLSearchParams(window.location.search).get('workbookId'); if (id || rows[0]) return openWorkbook(id || rows[0].id); }).catch(e => setError(e.message));
    const unload = (e: BeforeUnloadEvent) => { if (pending.current.size) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', unload);
    return () => { alive.current = false; generation.current++; if (timer.current) clearTimeout(timer.current); window.removeEventListener('beforeunload', unload); };
  }, [loadCatalog, openWorkbook]);

  async function saveQuestion(questionId: string) {
    if (!workbook || local || saving.current.has(questionId) || !pending.current.has(questionId) || conflictRef.current.has(questionId)) return;
    saving.current.add(questionId);
    const version = generation.current, workbookId = workbook.id;
    try {
      while (pending.current.has(questionId)) {
        const response = pending.current.get(questionId)!;
        const res = await fetch(`${API}?id=${encodeURIComponent(workbookId)}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Fracture-Context': context }, body: JSON.stringify({ questionId, response, expectedRevision: revisions.current.get(questionId) ?? 0 }) });
        const body = await res.json() as ApiBody;
        if (res.status === 409 && body.current) { conflictRef.current.set(questionId, body.current); setConflicts(v => ({ ...v, [questionId]: body.current! })); }
        if (!res.ok) throw new Error(body.error || 'Unable to save your answer.');
        if (!alive.current || generation.current !== version) return;
        const answer = body.answer as FractureAnswer;
        revisions.current.set(questionId, answer.revision); setSaved(v => ({ ...v, [questionId]: answer }));
        if (pending.current.get(questionId) === response) pending.current.delete(questionId);
        setPendingCount(pending.current.size); setSaveStatus(pending.current.size ? 'Saving answers…' : 'All changes saved');
      }
    } catch (e) { if (alive.current && generation.current === version) { setError(e instanceof Error ? e.message : 'Unable to save.'); setSaveStatus('Answers need attention · your text is preserved'); } }
    finally { saving.current.delete(questionId); }
  }
  function resolveConflict(id: string, keepMine: boolean) {
    const current = conflictRef.current.get(id); if (!current) return;
    conflictRef.current.delete(id); setConflicts(v => { const next = { ...v }; delete next[id]; return next; });
    revisions.current.set(id, current.revision); setError('');
    if (keepMine) void saveQuestion(id);
    else { pending.current.delete(id); setPendingCount(pending.current.size); setResponses(v => ({ ...v, [id]: current.response })); setSaved(v => ({ ...v, [id]: current })); setSaveStatus(pending.current.size ? 'Answers pending' : 'All changes saved'); }
  }
  function saveAll() { if (timer.current) clearTimeout(timer.current); for (const id of pending.current.keys()) void saveQuestion(id); }
  function answer(questionId: string, response: string) {
    setResponses(v => ({ ...v, [questionId]: response }));
    if (local) { setSaveStatus('Local preview · responses are not saved'); return; }
    pending.current.set(questionId, response); setPendingCount(pending.current.size); setSaveStatus('Saving answers…');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(saveAll, 500);
  }
  async function chooseFile(file: File | undefined) {
    if (!file) return;
    if (pending.current.size) { setError('Save your pending answers before opening a package.'); return; }
    setBusy(true); setError('');
    try {
      if (file.size > 24 * 1024 * 1024) throw new Error('The package must be smaller than 24 MB.');
      const raw = await file.text(), payload = await parse(raw);
      generation.current++; setImportOpen(true); setLocal({ raw, payload }); setWorkbook(null); setCaseIndex(0); setImageIndex(0); setResponses({}); setSaved({});
      setPrivacy(false); setReuse(false); setSaveStatus('Local preview · nothing has been uploaded');
    } catch (e) { setError(e instanceof Error ? e.message : 'Invalid package.'); }
    finally { setBusy(false); }
  }
  async function importWorkbook() {
    if (!local || !privacy || !reuse) return;
    setBusy(true); setError('');
    try {
      const res = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Fracture-Context': context, 'X-Fracture-Clearance': 'private-review-privacy-and-reuse-confirmed', 'X-Workbook-Title': encodeURIComponent(title) }, body: local.raw });
      const body = await res.json() as ApiBody;
      if (!res.ok) throw new Error(body.error || 'The import did not finish. Your local preview is still available.');
      await loadCatalog(); await openWorkbook(body.workbook.id);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to import workbook.'); }
    finally { setBusy(false); }
  }
  const cases = local?.payload.cases ?? workbook?.cases ?? [];
  const activeCase = cases[caseIndex], image = activeCase?.images[imageIndex];
  const caseTitle = `Case ${caseIndex + 1}`;
  const changeCase = (index: number) => { saveAll(); setCaseIndex(index); setImageIndex(0); };
  return <main className={`app-shell runtime-theme fracture-workspace ${theme === 'light' ? 'theme-light' : ''}`} id="main-education-workspace">
    <div className="purpose-banner"><strong>Didanix Education</strong><span>Educational review · not for diagnosis</span><small>Private draft workbook</small></div>
    <header className="app-header fracture-header"><BrandLockup tone={theme} /><div><strong>Fracture examinations</strong><small>{local ? 'Local preview' : workbook?.title || 'Private workbooks'}</small></div>
      <nav aria-label="Education workspace"><a href="/learn">Learning workspace</a><button disabled={!ready || busy} onClick={() => setImportOpen(v => !v)} aria-expanded={importOpen}>Import workbook</button><button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? 'Light' : 'Dark'} appearance</button></nav></header>
    {error && <div className="fracture-message" role="alert">{error} <button onClick={() => { setError(''); if (pending.current.size) saveAll(); else void loadCatalog().catch(e => setError(e.message)); }}>Retry</button></div>}
    {(importOpen || (ready && !catalog.length && !cases.length)) && <section className="fracture-import" aria-label="Import a fracture workbook">
      <h1>Import a fracture workbook</h1><p>Open the prepared package to review its images locally. Import it once to keep the workbook in your private website workspace.</p>
      <label>Review package<input type="file" accept=".vm-fracture.json,.json" disabled={busy} onChange={e => void chooseFile(e.target.files?.[0])} /></label>
      {local && <><label>Workbook title<input value={title} maxLength={120} onChange={e => setTitle(e.target.value)} /></label>
        <p>{local.payload.cases.length} cases · {local.payload.cases.reduce((n, c) => n + c.images.length, 0)} images · {local.payload.cases.reduce((n, c) => n + c.questions.length, 0)} questions. Clinical review remains pending.</p>
        <label className="fracture-confirm"><input type="checkbox" checked={privacy} onChange={e => setPrivacy(e.target.checked)} />I have checked every image for identifying information and cleared these images for private hosted review.</label>
        <label className="fracture-confirm"><input type="checkbox" checked={reuse} onChange={e => setReuse(e.target.checked)} />I have permission to store and use these exact images and questions for educational review on this website.</label>
        <button className="primary-button" disabled={busy || !privacy || !reuse || !title.trim()} onClick={() => void importWorkbook()}>{busy ? 'Importing…' : 'Import into my workspace'}</button>
        <button className="secondary-button" onClick={() => setImportOpen(false)}>Review images first</button></>}
    </section>}
    {!ready && !error && <p role="status" className="fracture-message">Loading private workbooks…</p>}
    {(catalog.length > 0 || cases.length > 0) && <section className="viewer-workspace">
      <aside className="case-browser" aria-label="Workbook cases"><div className="workbook-switcher"><label htmlFor="fracture-workbook">Workbook</label><select id="fracture-workbook" value={local ? '' : workbook?.id || ''} disabled={busy || pendingCount > 0} onChange={e => void openWorkbook(e.target.value)}><option value="" disabled>{local ? 'Local preview' : 'Select workbook'}</option>{catalog.map(w => <option key={w.id} value={w.id}>{w.title}</option>)}</select></div>
        <div className="browser-heading">{cases.length} cases</div><ol className="fracture-cases">{cases.map((c, i) => <li key={c.id}><button aria-current={i === caseIndex ? 'true' : undefined} onClick={() => changeCase(i)}><strong>Case {i + 1}</strong><small>{c.images.length} views · {c.questions.length} questions</small></button></li>)}</ol>
      </aside>
      <section className="fracture-viewer" aria-label="Didanix image viewer"><div className="fracture-series" aria-label="Image views">{activeCase?.images.map((im, i) => <button key={im.id} aria-pressed={i === imageIndex} onClick={() => setImageIndex(i)}>{im.view || `View ${i + 1}`}{im.laterality ? ` · ${im.laterality}` : ''}</button>)}</div>
        {image && <RasterViewport key={`${activeCase.id}:${image.id}:${workbook?.id || 'local'}`} image={image} workbookId={workbook?.id || ''} context={context} localImage={local?.payload.cases[caseIndex].images[imageIndex].base64} />}
      </section>
      <aside className="answer-panel"><div className="panel-head"><span>{caseTitle} · Questions</span><small role="status">{saveStatus}</small></div><div className="panel-scroll">
        <p className="case-description">Private draft review. Questions, proposed marks and answer guidance await clinical approval.</p>
        {activeCase?.questions.map((q, i) => <div key={q.id}>{activeCase.assessment ? <FractureCaseResponse id={q.id} index={caseIndex} response={responses[q.id] || ''} answerKey={activeCase.assessment} editable={!busy} onChange={answer} /> : <EducationQuestionResponse question={q} index={i} response={responses[q.id] || ''} revision={saved[q.id]?.revision || 0} editable={!busy} onChange={answer} />}
          {conflicts[q.id] && <div role="alert" className="fracture-guidance"><p>A different answer was saved in another tab:</p><blockquote>{conflicts[q.id].response || '(Blank answer)'}</blockquote><button onClick={() => resolveConflict(q.id, false)}>Use saved answer</button><button onClick={() => resolveConflict(q.id, true)}>Save my answer instead</button></div>}
          <details className="fracture-guidance"><summary>Draft answer guidance</summary><p>{q.answer || 'Answer key awaiting clinical review.'}</p>{q.rationale && <p>{q.rationale}</p>}</details></div>)}
      </div><div className="panel-actions"><button className="secondary-button" disabled={caseIndex === 0} onClick={() => changeCase(caseIndex - 1)}>Previous</button><button className="primary-button" disabled={caseIndex >= cases.length - 1} onClick={() => changeCase(caseIndex + 1)}>Next case</button>{pendingCount > 0 && <button onClick={saveAll}>Save answers</button>}</div></aside>
    </section>}
  </main>;
}
