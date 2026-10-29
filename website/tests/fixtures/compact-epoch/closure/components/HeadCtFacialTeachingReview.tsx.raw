import {HEAD_LINK_REVISION} from '../lib/head-atlas-links.ts';
import {HEAD_CT_FACIAL_COMPARISON_REVISION,verifiedHeadCtFacialComparisonPacket} from '../lib/head-ct-facial-comparison-review.ts';
import {HEAD_CT_FACIAL_TEACHING_REVISION,headCtFacialTeachingContent,verifiedHeadCtFacialTeachingRevision} from '../lib/head-ct-facial-teaching.ts';
import {HEAD_CT_FACIAL_CLINICAL_REVISION,headCtFacialClinicalContent,verifiedHeadCtFacialClinicalRevision} from '../lib/head-ct-facial-clinical.ts';
import {HeadCtFacialDecisionPanel} from './HeadCtFacialDecisionPanel';

/** Mount only inside the existing authorized head-learning Review route. */
export async function HeadCtFacialTeachingReview({manifestRevision,teachingRevision,clinicalRevision}:{manifestRevision:string;teachingRevision:string|null;clinicalRevision:string|null}){
  const [comparison,teachingPin,clinicalPin]=await Promise.all([
    verifiedHeadCtFacialComparisonPacket(manifestRevision),
    verifiedHeadCtFacialTeachingRevision(manifestRevision),
    verifiedHeadCtFacialClinicalRevision(manifestRevision),
  ]);
  if(manifestRevision!==HEAD_LINK_REVISION||!comparison||comparison.items.length!==3||
    teachingPin!==HEAD_CT_FACIAL_TEACHING_REVISION||teachingRevision!==teachingPin||
    clinicalPin!==HEAD_CT_FACIAL_CLINICAL_REVISION||clinicalRevision!==clinicalPin){
    return <section id="head-ct-facial-teaching-review" role="alert">Facial teaching and clinical evidence is unavailable for these exact source and packet revisions. No earlier decision transfers.</section>;
  }
  return <details id="head-ct-facial-teaching-review" className="head-review-packet" aria-labelledby="head-ct-facial-teaching-title">
    <summary><h2 id="head-ct-facial-teaching-title">CT facial anatomy and clinical orientation · independent drafts</h2></summary>
    <p>Source-bound evidence and separate personal educational reviews. No clinical or publication approval, patient registration or saved assessment score is supplied.</p>
    <p id="head-ct-facial-clinical-review">Review anatomy/questions and clinical orientation independently for each bone below. Older comparison and teaching decisions do not cover these packets. Closed review controls do not load private history.</p>
    <dl><dt>Head manifest</dt><dd><code>{manifestRevision}</code></dd>
      <dt>Comparison packet</dt><dd><code>{HEAD_CT_FACIAL_COMPARISON_REVISION}</code></dd>
      <dt>Teaching and question packet</dt><dd><code>{teachingPin}</code></dd>
      <dt>Independent clinical packet</dt><dd><code>{clinicalPin}</code></dd></dl>
    <p>{headCtFacialTeachingContent.scope}</p><p>{headCtFacialClinicalContent.scope}</p>
    <ol>{comparison.items.map((item,index)=>{
      const note=headCtFacialTeachingContent.notes[index],question=headCtFacialTeachingContent.questions[index],clinical=headCtFacialClinicalContent.notes[index];
      return <li key={item.conceptId} id={'head-ct-facial-teaching-'+item.conceptId}>
        <h3>{item.binding!.label}</h3>
        <dl><dt>Concept</dt><dd><code>{item.conceptId}</code></dd>
          <dt>Exact native CT ID and label</dt><dd><code>{item.ct.id}</code> · {item.ct.label}</dd>
          <dt>Side and representation</dt><dd>{item.ct.laterality} · {item.ct.representation}</dd>
          <dt>Generic 3D ID and source</dt><dd><code>{item.atlas.structureId}</code> · <code>{item.atlas.sourceHash}</code></dd></dl>
        <p>{item.binding!.scopeNote}</p>
        <p><a href={item.binding!.ctHref}>Inspect source CT separately</a> · <a href={item.binding!.atlasHref}>Inspect generic 3D bone separately</a></p>
        <p><strong>Anatomy:</strong> {note.anatomy.text} <strong>Function:</strong> {note.function.text}</p>
        <p><strong>CT learning task:</strong> {note.task}</p>
        <p><strong>Practice question:</strong> {question.prompt} <strong>Explanation:</strong> {question.explanation}</p>
        <p><strong>Clinical orientation:</strong> {clinical.text} <strong>Limit:</strong> {clinical.caution}</p>
        <p><strong>Reflection:</strong> {clinical.question} {clinical.answer}</p>
        <div className="head-review-actions">
          <HeadCtFacialDecisionPanel key={`teaching:${item.conceptId}:${teachingPin}`} manifestRevision={manifestRevision} conceptId={item.conceptId} label={item.binding!.label} kind="teaching"/>
          <HeadCtFacialDecisionPanel key={`clinical:${item.conceptId}:${clinicalPin}`} manifestRevision={manifestRevision} conceptId={item.conceptId} label={item.binding!.label} kind="clinical"/>
        </div>
      </li>;
    })}</ol>
    <h3>Sources and checks · separate packets</h3>
    <ul>{headCtFacialTeachingContent.sources.map(source=><li key={source.id}><a href={source.url}>{source.title}</a> · {source.reuse}</li>)}</ul>
    <ol>{headCtFacialTeachingContent.reviewChecks.map(check=><li key={check}>{check}</li>)}</ol>
    <ul>{headCtFacialClinicalContent.sources.map(source=><li key={source.id}><a href={source.url}>{source.title}</a> · {source.evidence}</li>)}</ul>
    <ol>{headCtFacialClinicalContent.reviewChecks.map(check=><li key={check}>{check}</li>)}</ol>
  </details>;
}
