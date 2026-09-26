import Link from 'next/link';
import { Brand } from '../../../brand';
import candidate from '@/content/skin-review-candidate.json';
import { SkinCandidateViewer } from './viewer';
import './skin.css';
export const metadata={title:'Skin candidate review | Visible Medicine'};
export default function SkinCandidatePage(){
  return <main className="skin-candidate">
    <header><Brand surface="light"/><Link href="/review/overview">Back to clinical review</Link></header>
    <h1>Whole-body skin <span>Candidate review</span></h1>
    <p>This original source surface is not in the learner atlas. Inspect it here; no approval or review decision is saved from this page.</p>
    <SkinCandidateViewer/>
    <details><summary>Source findings and review limits</summary>
      <p>Duplicate vertex positions account for the apparent open seams. The source mesh has not been welded or repaired.</p>
      <p>The directional head screen is inconclusive near a facial opening. The enlarged sections place the sampled frontal-bone points within the head outline; this is not clinical validation or proof that every internal structure fits.</p>
      <p>Sections below are intersections of original model surfaces, not CT or MRI. The common source frame is unchanged.</p>
      {/* Original licensed scientific projection, not an AI illustration. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={candidate.section.url} alt="Axial, sagittal and coronal source-coordinate section lines of skin and frontal bone, with a flagged sample marked in red. Not clinical imaging." width={1560} height={730}/>
      <p>Clinical accuracy, all internal relationships, self-intersections, mobile performance and final appearance still require review. No patient imaging is used or registered.</p>
      <p>Source: FMA7163 / FJ2810 · <code>{candidate.sourceSha256}</code></p>
      <p>{candidate.changes}</p>
    </details>
    <footer>{candidate.credit}. <a href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html">Source licence</a></footer>
  </main>;
}
