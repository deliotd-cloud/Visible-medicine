import {HEAD_TEACHING_REVISION,headTeachingPacket,headTeachingForConcept} from '../lib/head-atlas-teaching';
import {HEAD_LEARNING_REVISION,headLearningPacket,headLearningLinks} from '../lib/head-atlas-learning';
import type {ReactNode} from 'react';
import {HeadTeachingReviewNavigator} from './HeadTeachingReviewNavigator';
import {HeadReviewImageLink} from './HeadReviewImageLink';
import {BRAINSTEM_CLINICAL_REVISION,brainstemClinicalPacket,brainstemClinicalForConcept} from '../lib/head-brainstem-clinical.ts';
import {VENTRICULAR_CLINICAL_REVISION,ventricularClinicalPacket,ventricularClinicalForConcept} from '../lib/head-ventricular-clinical.ts';

/** Read-only packet. No decision is recorded, inherited or converted to publication. */
export function HeadAtlasTeachingReview({revision,reviewNotes,clinicalNotes,ventricularNotes,deepGreyReview,lobarReview,hippocampalReview,mriOnlyClinicalReview,knowledgeReview,mriKnowledgeReview,comparisonReview,insulaReview,orbitalReview,ctBoneReview,imageOnlyReview,additionalTargets=[]}:{revision:string;reviewNotes?:ReactNode;clinicalNotes?:ReactNode;ventricularNotes?:ReactNode;deepGreyReview?:ReactNode;lobarReview?:ReactNode;hippocampalReview?:ReactNode;mriOnlyClinicalReview?:ReactNode;knowledgeReview?:ReactNode;mriKnowledgeReview?:ReactNode;comparisonReview?:ReactNode;insulaReview?:ReactNode;orbitalReview?:ReactNode;ctBoneReview?:ReactNode;imageOnlyReview?:ReactNode;additionalTargets?:readonly {id:string;label:string}[]}){
  const packet=headTeachingPacket(),learningPacket=headLearningPacket(),clinicalPacket=brainstemClinicalPacket();
  const clinicalReady=clinicalPacket.content.headRevision===revision&&clinicalPacket.content.notes.every(note=>brainstemClinicalForConcept(note.conceptId,'CT',revision)&&brainstemClinicalForConcept(note.conceptId,'MRI',revision));
  const ventricularPacket=ventricularClinicalPacket();
  const ventricularReady=ventricularPacket.content.headRevision===revision&&ventricularPacket.content.notes.every(note=>ventricularClinicalForConcept(note.conceptId,'CT',revision)&&ventricularClinicalForConcept(note.conceptId,'MRI',revision));
  if(revision!==packet.content.headRevision||packet.bindings.some(binding=>!binding||binding.headRevision!==revision)||
    learningPacket.headRevision!==revision||learningPacket.teachingRevision!==HEAD_TEACHING_REVISION||
    learningPacket.sequences.some(sequence=>sequence.bindings.some((binding,index)=>!binding||binding.headRevision!==revision||binding.conceptId!==sequence.concepts[index])))return <main className="review-workspace"><h1>Head learning draft unavailable</h1><p role="alert">The current head source does not match this teaching packet. No notes or comparison targets have been substituted. Rebind and review the exact new source before continuing.</p></main>;
  return <main className="review-workspace head-learning-review" style={{overflowWrap:'anywhere'}}>
    <p><a href="/workspace/atlas-review/source-comparisons">Back to source comparisons</a></p>
    <h1>Head learning · anatomy draft</h1>
    <p>{packet.content.notes.length} original teaching summaries for the linked 3D focus, CT/MRI Structure and Guided learning. The reference 3D view shares anatomy, function and separate clinical drafts, not scan-specific observation exercises. Not clinically signed off. This packet is read-only: opening it does not save an approval or change any source.</p>
    <div className="head-review-start">
      <HeadTeachingReviewNavigator targets={[...packet.content.notes.map(note=>({id:'head-teaching-'+note.conceptId,label:headTeachingForConcept(note.conceptId,'CT',revision)?.concept.label??note.conceptId})),...additionalTargets]}/>
      <nav aria-label="Head review sections">
        {reviewNotes&&<a href="#head-review-notes-title">Private notes</a>}
        {comparisonReview&&<a href="#mri-only-comparisons">MRI-only evidence</a>}
        {mriOnlyClinicalReview&&<a href="#mri-only-clinical-review">MRI-only clinical correlations</a>}
        {mriKnowledgeReview&&<a href="#head-mri-anatomy-check-review">MRI-only anatomy checks</a>}
        {insulaReview&&<a href="#insula-comparisons">Insula evidence</a>}
        {orbitalReview&&<a href="#orbital-comparisons">Globe evidence</a>}
        {ctBoneReview&&<a href="#ct-bone-comparisons">CT bone evidence</a>}
        {imageOnlyReview&&<a href="#image-only-comparisons">Cerebellar CT/MRI evidence</a>}
        <a href="#head-guided-review">Guided sequences</a>{knowledgeReview&&<a href="#head-anatomy-check-review">Anatomy knowledge checks</a>}{clinicalReady&&<a href="#brainstem-clinical-review">Brainstem clinical correlations</a>}{ventricularReady&&<a href="#ventricular-clinical-review">Ventricular clinical correlations</a>}<a href="#head-review-references">References</a>
      </nav>
      <p>Choose a structure to open its summary or separate comparison evidence. Only available evidence is listed. Notes remain on this page and retain their own packet scope; navigation does not combine reviews or save an approval.</p>
    </div>
    <details className="head-review-packet"><summary>Exact revisions &amp; teaching checklist · draft, no recorded sign-off</summary>
      <dl><dt>Teaching packet SHA-256</dt><dd><code>{HEAD_TEACHING_REVISION}</code></dd><dt>Head manifest SHA-256</dt><dd><code>{packet.content.headRevision}</code></dd><dt>Review status</dt><dd>Draft · no recorded sign-off</dd></dl>
      <h2>Review checklist</h2><ol>{packet.content.reviewChecks.map(item=><li key={item}>{item}</li>)}</ol>
    </details>
    {comparisonReview}
    {mriOnlyClinicalReview}
    {insulaReview}
    {orbitalReview}
    {ctBoneReview}
    {imageOnlyReview}
    {reviewNotes}
    {knowledgeReview}
    {mriKnowledgeReview}
    {deepGreyReview}
    {lobarReview}
    {hippocampalReview}
    {clinicalReady&&<details id="brainstem-clinical-review" className="head-review-packet">
      <summary>Brainstem clinical correlations · separate draft packet</summary>
      <p>{clinicalPacket.content.scope}</p><p>This read-only extension has no recorded clinical sign-off. The anatomy-notes form does not save a decision for this packet.</p>
      {clinicalNotes??<p>Private clinical corrections are unavailable until this packet’s exact revision is verified. Do not save them against the original anatomy packet.</p>}
      <p>Clinical packet SHA-256: <code>{BRAINSTEM_CLINICAL_REVISION}</code></p>
      <ol>{clinicalPacket.content.reviewChecks.map(check=><li key={check}>{check}</li>)}</ol>
      {clinicalPacket.content.notes.map(note=><section key={note.conceptId}>
        <h3>{note.title}</h3><p>{note.text}</p><p>{note.caution}</p><h4>Reflection</h4><p>{note.question}</p><p>{note.answer}</p>
        <p><HeadReviewImageLink conceptId={note.conceptId} modality="CT" revision={revision}>Inspect clinical CT target</HeadReviewImageLink> · <HeadReviewImageLink conceptId={note.conceptId} modality="MRI" revision={revision}>Inspect clinical MRI target</HeadReviewImageLink></p>
        <p>Factual sources: {note.sources.join(', ')}</p>
      </section>)}
      <h3>CT pitfall</h3><p>{clinicalPacket.content.imaging.CT.text}</p><p>Sources: {clinicalPacket.content.imaging.CT.sources.join(', ')}</p>
      <h3>MRI pitfall</h3><p>{clinicalPacket.content.imaging.MRI.text}</p><p>Sources: {clinicalPacket.content.imaging.MRI.sources.join(', ')}</p>
      <ul>{clinicalPacket.content.sources.map(source=><li key={source.id}><code>{source.id}</code> · <a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a><p>{source.evidence}</p></li>)}</ul>
      <p>{clinicalPacket.content.reuse} Sources checked {clinicalPacket.content.accessed}.</p>
      <details><summary>Exact CT/MRI/3D clinical bindings</summary><pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{JSON.stringify(clinicalPacket.bindings,null,2)}</pre></details>
    </details>}
    {ventricularReady&&<details id="ventricular-clinical-review" className="head-review-packet">
      <summary>Ventricular clinical correlations · separate draft packet</summary>
      <p>{ventricularPacket.content.scope}</p><p>This read-only extension has no recorded clinical sign-off. Neither the anatomy nor brainstem notes form records a decision for this packet.</p>
      {ventricularNotes??<p>Private ventricular corrections are unavailable until this packet’s exact revision is verified.</p>}
      <p>Clinical packet SHA-256: <code>{VENTRICULAR_CLINICAL_REVISION}</code></p>
      <ol>{ventricularPacket.content.reviewChecks.map(check=><li key={check}>{check}</li>)}</ol>
      {ventricularPacket.content.notes.map(note=><section key={note.conceptId}>
        <h3>{note.title}</h3><p>{note.text}</p><p>{note.caution}</p><h4>Reflection</h4><p>{note.question}</p><p>{note.answer}</p>
        <p><HeadReviewImageLink conceptId={note.conceptId} modality="CT" revision={revision}>Inspect ventricular CT target</HeadReviewImageLink> · <HeadReviewImageLink conceptId={note.conceptId} modality="MRI" revision={revision}>Inspect ventricular MRI target</HeadReviewImageLink> · <a href={ventricularClinicalForConcept(note.conceptId,'CT',revision)!.binding.atlasHref}>Inspect ventricular 3D target</a></p>
        <p>Factual sources: {note.sources.join(', ')}</p>
      </section>)}
      <h3>CT pitfall</h3><p>{ventricularPacket.content.imaging.CT.text}</p><p>Sources: {ventricularPacket.content.imaging.CT.sources.join(', ')}</p>
      <h3>MRI pitfall</h3><p>{ventricularPacket.content.imaging.MRI.text}</p><p>Sources: {ventricularPacket.content.imaging.MRI.sources.join(', ')}</p>
      <ul>{ventricularPacket.content.sources.map(source=><li key={source.id}><code>{source.id}</code> · <a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a><p>{source.evidence}</p></li>)}</ul>
      <p>{ventricularPacket.content.reuse} Sources checked {ventricularPacket.content.accessed}.</p>
      <details><summary>Exact CT/MRI/3D clinical bindings</summary><pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{JSON.stringify(ventricularPacket.bindings,null,2)}</pre></details>
    </details>}
    <details id="head-guided-review" className="head-review-packet" aria-label="Guided sequence draft review">
      <summary>Guided sequences · {learningPacket.sequences.length} in a separate draft packet</summary>
      <p>Review the step order, available native landmarks and exact CT/MRI/3D targets below. The teaching-notes form above is bound to the teaching packet only; it does not record a sequence decision. These sequences have no stored clinical sign-off.</p>
      <dl><dt>Sequence packet SHA-256</dt><dd><code>{HEAD_LEARNING_REVISION}</code></dd><dt>Bound teaching SHA-256</dt><dd><code>{learningPacket.teachingRevision}</code></dd></dl>
      <p>{learningPacket.scope}</p>
      {learningPacket.sequences.map(sequence=><details key={sequence.id}><summary>{sequence.label} · {sequence.concepts.length} steps</summary><ol>{sequence.concepts.map(conceptId=>{
        const links=headLearningLinks({sequenceId:sequence.id,conceptId}),note=headTeachingForConcept(conceptId,'CT',revision);
        return <li key={conceptId}>{note?.concept.label??conceptId}{links&&<> · <a href={links.atlasHref}>Inspect 3D step</a> · <a href={links.ctHref}>Inspect CT step</a> · <a href={links.mriHref}>Inspect MRI step</a></>}</li>;
      })}</ol></details>)}
    </details>
    <h2>Teaching summaries · {packet.content.notes.length}</h2>
    {packet.content.notes.map(note=>{
      const ct=headTeachingForConcept(note.conceptId,'CT',revision),mri=headTeachingForConcept(note.conceptId,'MRI',revision);
      if(!ct||!mri)return <p role="alert" key={note.conceptId}>Source binding unavailable: {note.conceptId}. Do not review against a substituted structure.</p>;
      return <details key={note.conceptId} id={'head-teaching-'+note.conceptId} className="head-review-summary" aria-label={ct.concept.label}>
        <summary><h3>{ct.concept.label}</h3></summary><p><code>{note.conceptId}</code></p>
        <h4>Anatomy &amp; relationships</h4><p>{note.anatomy.text}</p><h4>Function</h4><p>{note.function.text}</p>
        <h4>CT · reading the image</h4><p>{ct.imaging.text}</p><h4>MRI · reading the image</h4><p>{mri.imaging.text}</p>
        <h4>Try this</h4><p>{note.task}</p><p>{ct.scope}</p>
        <p><HeadReviewImageLink conceptId={note.conceptId} modality="CT" revision={revision}>Inspect CT target</HeadReviewImageLink> · <HeadReviewImageLink conceptId={note.conceptId} modality="MRI" revision={revision}>Inspect MRI target</HeadReviewImageLink> · <a href={ct.concept.atlasHref}>Inspect existing 3D target</a></p>
        <details><summary>Exact comparison bindings</summary><pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{JSON.stringify(ct.concept,null,2)}</pre></details>
      </details>;
    })}
    <details id="head-review-references" className="head-review-packet"><summary>References &amp; reuse audit</summary><p>Original factual summaries only. No reference illustrations, scans, meshes, fonts, textures, article text or datasets are bundled by this change. No new dependencies or fees.</p>
    <ul>{packet.content.sources.map(source=><li key={source.id}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a><p>{source.reuse} Checked {source.accessed}.</p><code>{source.id}</code></li>)}</ul>
    </details>
  </main>;
}
