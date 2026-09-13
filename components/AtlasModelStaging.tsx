'use client';

import { useEffect, useRef, useState } from 'react';
import type { AtlasStoredModel } from '@/lib/atlas-model-storage';
import { verifyAtlasModelDownload } from '@/lib/atlas-model-download';
import { verifyAtlasDelivery } from '@/lib/atlas-delivery-check';
import { atlasStagingCheckModels } from '@/lib/atlas-model-staging-registry';
import styles from './AtlasModelStaging.module.css';

export function AtlasModelStaging({ models, deliveryModels }: { models: AtlasStoredModel[]; deliveryModels: AtlasStoredModel[] }) {
  const [files, setFiles] = useState<File[]>([]);
  const [states, setStates] = useState<Record<string, string>>({});
  const [responseMetadata, setResponseMetadata] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('Check storage, or select the registered GLB model files to stage.');
  const [busy, setBusy] = useState(false);
  const [checkedModels, setCheckedModels] = useState<readonly AtlasStoredModel[]>(models);
  const active = useRef<AbortController | null>(null);
  useEffect(() => () => active.current?.abort(), []);
  const setStatus = (sha: string, status: string) => setStates(current => ({ ...current, [sha]: status }));
  async function run(mode: 'upload' | 'check' | 'download' | 'delivery') {
    if (active.current) return;
    const upload = mode === 'upload';
    const controller = new AbortController();
    active.current = controller;
    setBusy(true);
    setStates({});
    setResponseMetadata({});
    try {
      const selected: { file: File; model: AtlasStoredModel }[] = [];
      if (upload) {
        // Validate the whole selection locally before transmitting any file.
        for (const file of files) {
          if (controller.signal.aborted) throw new Error('Cancelled. Existing stored models are retained.');
          const candidates = models.filter(model => model.bytes === file.size && model.paths.some(path => path.split('/').pop() === file.name));
          if (!candidates.length) throw new Error(`${file.name}: not a registered model file. Nothing was uploaded.`);
          setMessage(`Checking ${file.name} locally…`);
          const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
          const sha = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
          const model = candidates.find(candidate => candidate.sha256 === sha);
          if (!model) throw new Error(`${file.name}: fingerprint mismatch. Nothing was uploaded.`);
          if (!selected.some(item => item.model.sha256 === sha)) selected.push({ file, model });
        }
        if (!selected.length) throw new Error('Select registered model files first.');
      }
      const queue = upload ? selected : atlasStagingCheckModels(mode, models, deliveryModels).map(model => ({ model, file: null }));
      setCheckedModels(queue.map(({ model }) => model));
      let verified = 0;
      for (const { model, file } of queue) {
        if (controller.signal.aborted) throw new Error('Cancelled. Existing stored models are retained.');
        setMessage(`${upload ? 'Staging' : mode === 'download' ? 'Verifying download' : mode === 'delivery' ? 'Checking Atlas delivery' : 'Checking'} ${verified + 1} of ${queue.length}…`);
        const url = `/api/atlas-models/${model.sha256}`;
        if (mode === 'delivery') {
          setStatus(model.sha256, 'Checking protected Atlas delivery');
          try {
            const result = await verifyAtlasDelivery(model, controller.signal);
            setResponseMetadata(current => ({ ...current, [model.sha256]: result.checks }));
            setStatus(model.sha256, 'Atlas delivery verified');
          } catch (error) { setStatus(model.sha256, 'Atlas delivery not verified'); throw error; }
          verified++;
          continue;
        }
        if (mode === 'download') {
          setStatus(model.sha256, 'Downloading for verification');
          try {
            const response = await fetch(url, { credentials: 'same-origin', signal: controller.signal, cache: 'no-store', redirect: 'error' });
            const etag = response.headers.get('etag');
            setResponseMetadata(current => ({ ...current, [model.sha256]: `HTTP ${response.status}; Content-Length ${response.headers.get('content-length') ?? 'omitted'}; ETag ${etag === null ? 'omitted' : etag.startsWith('W/') ? 'weak' : 'strong'}; ${response.headers.get('content-type')?.slice(0, 80) ?? 'no media type'}` }));
            await verifyAtlasModelDownload(response, model, controller.signal);
            setStatus(model.sha256, 'Full download verified');
          } catch (error) { setStatus(model.sha256, 'Download not verified'); throw error; }
          verified++;
          continue;
        }
        if (file) {
          setStatus(model.sha256, 'Uploading');
          const response = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'model/gltf-binary' }, body: file, credentials: 'same-origin', signal: controller.signal, redirect: 'error' });
          if (!response.ok) {
            setStatus(model.sha256, 'Upload not confirmed');
            throw new Error(`Upload not confirmed (${response.status}). Check storage before retrying.`);
          }
        }
        const response = await fetch(url, { method: 'HEAD', credentials: 'same-origin', signal: controller.signal, cache: 'no-store', redirect: 'error' });
        if (response.status === 404 && !file) setStatus(model.sha256, 'Not staged');
        else if (response.ok && response.headers.get('etag') === `"${model.sha256}"` && Number(response.headers.get('content-length')) === model.bytes) setStatus(model.sha256, 'Verified in storage');
        else {
          setStatus(model.sha256, 'Verification unavailable');
          throw new Error(`Storage verification stopped (${response.status}). Sign-in, permission or storage may need attention.`);
        }
        verified++;
      }
      setMessage(mode === 'delivery' ? 'All active Atlas URLs pass full-byte, HEAD, range and conditional checks through protected storage. Candidate-only models are not activated by this check. This is not clinical approval or a learner release.' : mode === 'download' ? 'All staged model downloads match their exact bytes and fingerprints.' : 'Check complete. Staging does not activate a release or grant learner access.');
    } catch (error) {
      setMessage(controller.signal.aborted ? 'Cancelled. No stored model was deleted. Check storage before resuming.' : error instanceof Error ? error.message : 'The operation could not finish.');
    } finally { active.current = null; setBusy(false); }
  }
  const verifiedCount = checkedModels.filter(model => ['Verified in storage', 'Full download verified', 'Atlas delivery verified'].includes(states[model.sha256])).length;
  const downloadedCount = checkedModels.filter(model => states[model.sha256] === 'Full download verified').length;
  return <section className={styles.panel} aria-label="Atlas model staging">
    <p>Registered files only. This is not a scan-upload page. Patient images, segmentation masks and unregistered models must not be selected.</p>
    <p>{models.length} models registered for staging; {deliveryModels.length} models in the active Atlas. Staging does not switch the active inventory.</p>
    <div className={styles.controls}>
      <label htmlFor="atlas-model-files">Registered GLB files<input id="atlas-model-files" type="file" accept=".glb,model/gltf-binary" multiple disabled={busy} onChange={event => setFiles(Array.from(event.target.files ?? []))} /></label>
      <button type="button" disabled={busy || !files.length} onClick={() => void run('upload')}>Stage selected files</button>
      <button type="button" disabled={busy} onClick={() => void run('check')}>Check storage</button>
      <button type="button" disabled={busy} onClick={() => void run('download')}>Verify full downloads</button>
      <button type="button" disabled={busy} onClick={() => void run('delivery')}>Check Atlas delivery</button>
      {busy && <button type="button" onClick={() => active.current?.abort()}>Cancel</button>}
    </div>
    <p role="status" aria-live="polite">{message}</p>
    <p>{verifiedCount} / {checkedModels.length} models verified in this check. Atlas release: administrator review only.</p>
    {downloadedCount > 0 && <p>{downloadedCount} / {checkedModels.length} full downloads verified. This checks transfer integrity, not clinical accuracy or viewer acceptance.</p>}
    <details><summary>Registered model inventory</summary><ul className={styles.models}>{models.map(model => <li key={model.sha256}>
      <span>{model.paths.map(path => path.replace('/atlas-runtime/', '')).join(', ')}</span>
      <small>{(model.bytes / 1048576).toFixed(2)} MB · {states[model.sha256] ?? 'Not checked'}</small>
      {responseMetadata[model.sha256] && <small>{responseMetadata[model.sha256]}</small>}
    </li>)}</ul></details>
  </section>;
}
