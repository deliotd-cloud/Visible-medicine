import { atlasModules } from "../lib/catalog";
import Link from "next/link";
import { listCatalogueCourses } from "../lib/education-platform";

export const dynamic = "force-dynamic";

export default async function Home() {
  const courses = await listCatalogueCourses();
  return (
    <main className="site-shell">
      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span /> Visible Medicine · by Elivion</p>
          <h1>Where medicine<br />becomes visible.</h1>
          <p className="hero-intro"><strong>Learn imaging. Teach with cases.</strong>Explore radiological anatomy, follow guided courses or build secure institutional teaching with a purpose-built educational viewer.</p>
          <div className="hero-actions">
            <Link className="primary-button" href="/atlas">Explore the atlas <span>→</span></Link>
            <Link className="text-button" href="/studio">Open Studio</Link>
          </div>
          <div className="trust-row" aria-label="Product principles">
            <span>Education &amp; research only</span><span>Institution ready</span><span>Viewer powered by Didanix</span>
          </div>
        </div>

        <Link className="atlas-preview" href="/atlas/ct-head">
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
          <div className="viewer-footer"><span>Brain</span><div className="slice-track"><i /></div><span className="didanix-credit"><small>Powered by</small> <b>Didanix</b></span></div>
        </Link>
      </section>

      <section className="platform-strip" aria-label="Visible Medicine platform">
        <Link href="/atlas"><span>01</span><div><b>Atlas</b><small>Explore reviewed anatomy on imaging</small></div><i>→</i></Link>
        <Link href="/courses"><span>02</span><div><b>Courses</b><small>Learn through guided cases and practice</small></div><i>→</i></Link>
        <Link href="/studio"><span>03</span><div><b>Studio</b><small>Create and deliver institutional teaching</small></div><i>→</i></Link>
      </section>

      <section className="content-section module-showcase">
        <div className="section-heading">
          <div><p className="section-index">01 / Atlas</p><h2>One normal study, explored properly.</h2></div>
          <p>Search structures and synonyms, move through the series, reveal only the anatomy you need and turn any position into retrieval practice.</p>
        </div>
        <div className="module-grid module-grid-compact">
          {atlasModules.slice(0, 3).map((module, index) => (
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
        <div className="section-action-row">
          <p>The CT head interface is prepared for publication-cleared imaging, reviewed labels and terminology mapping.</p>
          <Link className="outline-button" href="/atlas">View the complete Atlas roadmap <span>→</span></Link>
        </div>
      </section>

      <section className="dark-section" id="courses">
        <div className="dark-section-heading">
          <p className="section-index">02 / Courses</p>
          <h2>From recognition to understanding.</h2>
          <p>Atlas scenes become lessons, questions, saved views and live teaching sessions across Visible Medicine.</p>
          <Link href="/courses">Explore all courses <span>→</span></Link>
        </div>
        <div className="course-stack">
          {courses.slice(0, 3).map((course, index) => (
            <Link className="course-row" href={`/courses/${course.slug}`} key={course.slug}>
              <span className="course-number">0{index + 1}</span>
              <div><small>{course.publisherKind === "official" ? "Visible Medicine official" : "Institution-published"}</small><h3>{course.title}</h3></div>
              <p>{course.level} · {course.workbookCount} workbooks · {course.duration}</p>
              <b>↗</b>
            </Link>
          ))}
          <Link className="course-row studio-row" href="/studio">
            <span className="course-number">+</span><div><small>For educators</small><h3>Host your own imaging course</h3></div><p>Created in Visible Medicine Studio</p><b>↗</b>
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

      <section className="family-section" id="platform">
        <p className="section-index">04 / The platform</p>
        <h2>One education platform.<br />Three connected experiences.</h2>
        <div className="family-map">
          <div><span>Explore</span><h3>Atlas</h3><p>Reviewed radiological anatomy, labels, practice and linked explanations.</p></div>
          <div className="family-active"><span>Learn</span><h3>Courses</h3><p>Official learning paths and private institutional teaching.</p></div>
          <div><span>Create</span><h3>Studio</h3><p>Course authoring, assessment, live teaching and secure delivery.</p></div>
        </div>
        <div className="clinical-boundary"><div><span>Separate clinical product</span><b>Didanix PACS</b></div><p>Visible Medicine uses Didanix viewer technology for education only. The future clinically licensed PACS retains separate identity, patient data, licensing, release and quality systems; this platform provides no PACS access, diagnosis, reporting or patient-care workflow.</p></div>
        <div className="family-actions"><Link className="primary-button" href="/institutions">For institutions <span>→</span></Link><Link className="text-button" href="/pricing">View the commercial model</Link></div>
      </section>
    </main>
  );
}
