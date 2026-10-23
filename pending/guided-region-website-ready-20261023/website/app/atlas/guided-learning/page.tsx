import type {Metadata} from 'next';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {HeadAtlasLearningLibrary} from '../../../components/HeadAtlasLearningLibrary';
import {RegionalLearningCatalogue} from '../../../components/RegionalLearningCatalogue';
import {regionalLearningCatalogue} from '../../../lib/regional-learning-catalogue';
import {atlasBodyRegions} from '../../../lib/atlas-navigation';
import {parseHeadLearningDiscovery} from '../../../lib/head-learning-discovery';
import '../head-neck-3d/head-learning.css';
import './guided-learning.css';

export const metadata:Metadata={title:'Guided anatomy learning',description:'Search regional 3D anatomy tours and linked head sequences in CT, MRI and the existing 3D Atlas.',robots:{index:false,follow:false}};

export default async function GuidedLearningCatalogue({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
  const filter=parseHeadLearningDiscovery(await searchParams,atlasBodyRegions.map(region=>region.id));
  if(!filter)notFound();
  const selectedRegion=filter.region??'all';
  const selectedRegionData=atlasBodyRegions.find(region=>region.id===selectedRegion);
  const showHeadLibrary=selectedRegion==='all'||selectedRegion==='head-neck';
  const imagingWithoutExactTours=(filter.view==='CT'||filter.view==='MRI')&&!showHeadLibrary;
  const clearSearchParams=new URLSearchParams({view:filter.view});
  if(filter.region!==undefined)clearSearchParams.set('region',filter.region);
  const views=[['all','All tours'],['3D','3D Atlas'],['CT','CT'],['MRI','MRI']] as const;
  return <main className="atlas-hub atlas-guided-hub">
    <header className="atlas-hub-heading">
      <Link href="/atlas">← Atlas modalities</Link>
      <p className="eyebrow">Visible Medicine Atlas</p><h1>Guided learning.</h1>
      <p>Find a regional 3D tour or a linked head anatomy sequence. Each keeps its own source, review status and available views.</p>
      <form className="atlas-guided-search" action="/atlas/guided-learning" method="get" role="search" aria-label="Guided learning search">
        <div className="atlas-guided-search-row">
          <label>Search tours<input name="q" type="search" defaultValue={filter.query} maxLength={120} placeholder="Tour, step or structure" autoComplete="off"/></label>
          <label className="atlas-guided-region-select">Region<select name="region" defaultValue={selectedRegion}><option value="all">All regions</option>{atlasBodyRegions.map(region=><option key={region.id} value={region.id}>{region.label}</option>)}</select></label>
          <button type="submit" name="view" value={filter.view}>Search</button>
          {filter.query&&<Link href={`/atlas/guided-learning?${clearSearchParams}`} prefetch={false}>Clear search</Link>}
        </div>
        <nav className="atlas-guided-views" aria-label="Guided learning views">
          {views.map(([view,label])=><button key={view} type="submit" name="view" value={view} aria-current={filter.view===view?'page':undefined}>{label}</button>)}
        </nav>
      </form>
    </header>
    <details className="atlas-guided-regions" open={(filter.view==='all'||filter.view==='3D')&&(filter.view==='3D'||selectedRegion!=='all'||!!filter.query)}>
      <summary>Regional and whole-body 3D tours</summary>
      {(filter.view==='all'||filter.view==='3D')&&<RegionalLearningCatalogue key={JSON.stringify(filter)} catalogue={regionalLearningCatalogue()} initialQuery={filter.query} fixedQuery initialRegion={selectedRegion} fixedRegion/>}
      <details><summary>Browse regions directly</summary>
      <p>Open a region, then choose <strong>Guided learning</strong> in the atlas. Choose a tour and press Start; camera movement begins only when you ask. These 3D tours do not imply mapped CT, MRI, X-ray or ultrasound counterparts.</p>
      <nav aria-label="Open a region for 3D guided learning"><ul>{atlasBodyRegions.filter(region=>selectedRegion==='all'||region.id===selectedRegion).map(region=><li key={region.id}><Link href={region.href} prefetch={false}>{region.label}<span aria-hidden="true"> ↗</span></Link></li>)}</ul></nav>
      </details>
    </details>
    {imagingWithoutExactTours&&<section className="atlas-guided-no-imaging" aria-label={`${filter.view} tour availability`}>
      <h2>No exact {selectedRegionData?.label} {filter.view} tours here</h2>
      <p>The linked {filter.view} sequences in this catalogue cover head anatomy only. A regional 3D tour does not establish an imaging match.</p>
      <p><Link href={`/atlas/guided-learning?${new URLSearchParams({view:'3D',region:selectedRegion,...(filter.query?{q:filter.query}:{})})}`} prefetch={false}>Browse {selectedRegionData?.label} 3D tours</Link> or <Link href={`/atlas/guided-learning?${new URLSearchParams({view:filter.view,region:'head-neck',...(filter.query?{q:filter.query}:{})})}`} prefetch={false}>browse head {filter.view} tours</Link>.</p>
    </section>}
    {showHeadLibrary&&<div className="head-atlas-learning-library atlas-guided-head-library">
      <HeadAtlasLearningLibrary key={JSON.stringify(filter)} initialView={filter.view} initialQuery={filter.query} compact fixedView fixedQuery/>
    </div>}
    <p className="atlas-guided-access">Scan sources remain local. Opening this catalogue does not load scans, unlock imaging or paid lectures, or change review decisions. Each destination retains its own access checks.</p>
  </main>;
}
