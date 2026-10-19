import type { Metadata } from "next";
import Link from "next/link";
import { searchEducation } from "@/lib/platform-governance";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Search", description: "Search Visible Medicine anatomy, cases, courses and workbooks." };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const rawQuery = (await searchParams).q;
  const query = typeof rawQuery === "string" ? rawQuery.normalize("NFKC").trim().slice(0, 80) : "";
  const results = query.length >= 2 ? await searchEducation(query) : [];
  const groups = [...new Set(results.map((item) => item.kind))];
  return <main className="inner-page search-page">
    <section className="search-hero"><p className="eyebrow"><span /> Unified education search</p><h1>Find anatomy, cases and learning.</h1><form role="search"><label htmlFor="education-search">Search anatomy and education content</label><div><input id="education-search" name="q" type="search" defaultValue={query} placeholder="Try lateral ventricle, CT, neuroanatomy…" minLength={2} maxLength={80} autoFocus /><button type="submit">Search <span>→</span></button></div></form><p>Search reference anatomy, teaching cases, courses and published workbooks. Publication is not clinical approval; each resource keeps its own access checks. No clinical archive or patient index is connected.</p></section>
    <section className="search-results" aria-live="polite">{query.length >= 2 ? <><header><span>{results.length} {results.length === 1 ? "result" : "results"}</span><h2>Results for “{query}”</h2></header>{groups.map((group) => <div className="search-group" key={group}><h3>{group}</h3><div>{results.filter((item) => item.kind === group).map((item) => <Link href={item.href} key={`${item.kind}:${item.href}:${item.title}`}><span>{item.meta}</span><h4>{item.title}</h4><p>{item.summary}</p><b>{item.kind === "Anatomy concept" ? "Explore structure" : `Open ${item.kind.toLowerCase()}`} →</b></Link>)}</div></div>)}{!results.length && <div className="search-empty"><h3>No anatomy or education content matched.</h3><p>Try a modality, anatomy region, structure name or course title.</p><Link href="/atlas">Browse the Atlas →</Link></div>}</> : <div className="search-start"><span>⌕</span><h2>Choose your next learning step.</h2><p>Find a structure, anatomy view, teaching case, course or published workbook.</p><div><b>Anatomy</b><b>Cases</b><b>Courses</b><b>Workbooks</b></div></div>}</section>
  </main>;
}
