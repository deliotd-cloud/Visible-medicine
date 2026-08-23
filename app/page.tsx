import { atlasModules, courses } from "../lib/catalog";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <main className="site-shell">
      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span /> Education &amp; research only</p>
          <h1>See anatomy the way radiologists do.</h1>
          <p className="hero-intro">Explore expertly reviewed anatomy directly on CT and MRI, then turn what you see into lasting knowledge through guided courses and practice.</p>
          <div className="hero-actions">
            <Link className="primary-button" href="/atlas">Explore the atlas <span>→</span></Link>
            <Link className="text-button" href="/courses">Browse courses</Link>
          </div>
          <div className="trust-row" aria-label="Product principles">
            <span>Clinician reviewed</span><span>Imaging-first learning</span><span>Not for diagnosis</span>
          </div>
        </div>

        <Link className="atlas-preview" href="/atlas/ct-head" aria-label="Open the interactive CT head atlas preview">
          <div className="viewer-bar">
            <div><span className="live-dot" /> CT head · axial</div>
            <div className="viewer-tools" aria-hidden="true"><span>W/L</span><span>⌕</span><span>⤢</span></div>
          </div>
          <div className="viewer-stage">
            <div className="slice-count">34 <small>/ 120</small></div>
            <div className="orientation left">R</div><div className="orientation right">L</div>
            <div className="ct-scan" aria-hidden="true"><div className="ventricle v-left" /><div className="ventricle v-right" /></div>
            <div className="label label-one"><span /> Frontal lobe</div>
            <div className="label label-two"><span /> Caudate nucleus</div>
            <div className="label label-three"><span /> Sylvian fissure</div>
            <span className="viewer-cta">Open interactive module <b>↗</b></span>
          </div>
          <div className="viewer-footer"><span>Brain</span><div className="slice-track"><i /></div><span>Bone · Vessels · Brain</span></div>
        </Link>
      </section>

      <section className="system-strip" aria-label="Atlas collections">
        <p>Explore by region</p>
        {atlasModules.map((module, index) => <Link href={`/atlas/${module.slug}`} key={module.slug}><span>0{index + 1}</span>{module.region}<b>→</b></Link>)}
      </section>

      <section className="content-section module-showcase">
        <div className="section-heading">
          <div><p className="section-index">01 / Atlas</p><h2>Built around real imaging.</h2></div>
          <p>Move through anatomy as a continuous study, reveal only the structures you need and open the explanation without losing your place.</p>
        </div>
        <div className="module-grid">
          {atlasModules.map((module, index) => (
            <Link className={`module-card module-card-${index + 1}`} href={`/atlas/${module.slug}`} key={module.slug}>
              <div className="module-visual" aria-hidden="true"><i /><i /><i /></div>
              <div className="module-card-copy">
                <span>{module.status === "available" ? "Interactive preview" : "Planned module"}</span>
                <h3>{module.title}</h3>
                <p>{module.region} · {module.orientation}</p>
                <b>0{index + 1}</b>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="dark-section" id="courses">
        <div className="dark-section-heading">
          <p className="section-index">02 / Courses</p>
          <h2>From recognition to understanding.</h2>
          <p>Atlas scenes become lessons, questions, saved views and live teaching sessions through Didanix Education.</p>
          <Link href="/courses">Explore all courses <span>→</span></Link>
        </div>
        <div className="course-stack">
          {courses.map((course, index) => (
            <Link className="course-row" href={`/courses/${course.slug}`} key={course.slug}>
              <span className="course-number">0{index + 1}</span>
              <div><small>{course.type === "official" ? "Didanix official" : "Institution demonstration"}</small><h3>{course.title}</h3></div>
              <p>{course.level} · {course.lessons} lessons · {course.duration}</p>
              <b>↗</b>
            </Link>
          ))}
          <Link className="course-row studio-row" href="/teach">
            <span className="course-number">+</span><div><small>For educators</small><h3>Host your own imaging course</h3></div><p>Powered by Didanix Education</p><b>↗</b>
          </Link>
        </div>
      </section>

      <section className="content-section research-teaser" id="research">
        <div className="section-heading">
          <div><p className="section-index">03 / Research</p><h2>Versioned, citable and reproducible.</h2></div>
          <p>Every published atlas module is designed to retain its dataset provenance, editorial version, review history and stable resource links.</p>
        </div>
        <div className="research-grid">
          <div><span>Dataset provenance</span><b>Source, licence and de-identification evidence remain attached to every publication.</b></div>
          <div><span>Immutable versions</span><b>Courses and studies can pin an exact atlas release instead of silently changing underneath.</b></div>
          <div><span>Research boundary</span><b>Non-clinical research spaces stay distinct from public reviewed anatomy and learner records.</b></div>
        </div>
        <Link className="outline-button" href="/research">Read the research framework <span>→</span></Link>
      </section>

      <section className="family-section" id="institutions">
        <p className="section-index">The Elivion product family</p>
        <h2>One imaging foundation.<br />Distinct, deliberate products.</h2>
        <div className="elivion-parent">
          <Image src="/elivion-logo.png" alt="" width={264} height={208} />
          <div><span>Parent family</span><b>Elivion</b><p>One quality language for trusted healthcare and learning software, expressed differently for each intended use.</p></div>
        </div>
        <div className="family-map">
          <div><span>Clinical future</span><h3>Didanix PACS</h3><p>Separately governed clinical viewer and workflow product.</p></div>
          <div className="family-active"><span>Learning destination</span><h3>Didanix Atlas</h3><p>Reviewed radiological anatomy, practice and first-party courses.</p></div>
          <div><span>Teaching engine</span><h3>Didanix Education</h3><p>Course authoring, assessment, live teaching and secure embedding.</p></div>
        </div>
        <Link className="primary-button" href="/institutions">For institutions <span>→</span></Link>
      </section>
    </main>
  );
}
