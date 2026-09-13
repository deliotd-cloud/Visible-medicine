import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AtlasExplorer } from "../../../components/AtlasExplorer";
import { atlasModules, findAtlasModule } from "../../../lib/catalog";
import { ctHeadStructures } from "../../../lib/atlas-knowledge";
import {AtlasRegionNavigation} from '../../../components/AtlasRegionNavigation';

type PageProps = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return atlasModules.map((atlasModule) => ({ slug: atlasModule.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const atlasModule = findAtlasModule((await params).slug);
  if (!atlasModule) return {};
  return {
    title: atlasModule.title,
    description: atlasModule.description,
    openGraph: { title: `${atlasModule.title} | Visible Medicine Atlas`, description: atlasModule.description, images: [] },
    twitter: { title: `${atlasModule.title} | Visible Medicine Atlas`, description: atlasModule.description, images: [] },
  };
}

export default async function AtlasModulePage({ params }: PageProps) {
  const atlasModule = findAtlasModule((await params).slug);
  if (!atlasModule) notFound();
  return (
    <main className="atlas-module-page">
      <section className="module-titlebar">
        <div><Link href="/atlas">Atlas</Link><span>/</span><b>{atlasModule.region}</b></div>
        <h1>{atlasModule.title}</h1>
        <p>{atlasModule.description}</p>
        <div className="module-facts"><span>{atlasModule.modality}</span><span>{atlasModule.orientation}</span><span>{atlasModule.slug === "ct-head" ? `${ctHeadStructures.length} demonstration entries · no scan attached` : 'In preparation · no released images'}</span></div>
      </section>
      <AtlasRegionNavigation modality={atlasModule.modality === 'MRI' ? 'mri' : 'ct'} selected={atlasModule.slug === 'ct-head' ? 'head-neck' : atlasModule.slug === 'ct-chest' ? 'thorax' : atlasModule.slug === 'ct-abdomen' ? 'abdomen' : 'knee'}/>
      {atlasModule.status === "available" ? (
        <AtlasExplorer moduleSlug={atlasModule.slug} totalImages={atlasModule.images} />
      ) : (
        <section className="preview-pending">
          <div className="pending-scan" aria-hidden="true"><i /><i /><i /></div>
          <div><p className="section-index">Editorial preview</p><h2>This module is in the publication pipeline.</h2><p>The final module will be released only after image rights, de-identification, anatomical labelling and independent review are complete.</p><Link className="primary-button" href="/atlas/ct-head">Open the CT head demonstration <span>→</span></Link></div>
        </section>
      )}
      <section className="module-provenance">
        <div><span>Purpose</span><b>Education and non-clinical research</b></div>
        <div><span>Publication state</span><b>{atlasModule.status === "available" ? "Illustrative product demonstration" : "Not yet published"}</b></div>
        <div><span>Editorial record</span><b>{atlasModule.reviewed}</b></div>
        <p>This website does not accept clinical patient studies and must not be used for diagnosis or patient care.</p>
      </section>
    </main>
  );
}
