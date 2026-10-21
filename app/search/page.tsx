import type { Metadata } from "next";
import Link from "next/link";
import { searchEducation } from "@/lib/platform-governance";
import { normalizeSearchQuery, parseSearchKind, searchKindHref, searchKinds } from "@/lib/search-kind";
import "./search.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Search", description: "Search Visible Medicine anatomy, cases, courses and workbooks." };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string | string[]; kind?: string | string[] }> }) {
  const params = await searchParams;
  const query = normalizeSearchQuery(params.q);
  const kind = parseSearchKind(params.kind);
  const results = query.length >= 2 ? await searchEducation(query, kind) : [];
  const groups = [...new Set(results.map(item => item.kind))];
  const kindLabel = searchKinds.find(item => item.value === kind)!.label;

  return <main className="inner-page search-page">
    <section className="search-hero"><p className="eyebrow"><span /> Unified education search</p><h1>Find your next learning resource.</h1>
      <form role="search" action="/search" method="get"><label htmlFor="education-search">Search anatomy and education content</label><div><input id="education-search" name="q" type="search" defaultValue={query} placeholder="Try lateral ventricle, CT, neuroanatomy…" minLength={2} maxLength={80} /><button type="submit">Search <span>→</span></button></div>{kind !== 'all' && <input type="hidden" name="kind" value={kind} />}</form>
      <p className="search-access-note">Education search only. Publication is not clinical approval; each resource keeps its own access checks.</p>
      <details className="search-context"><summary>Source and access context</summary><p>Search covers reference anatomy, teaching cases, courses and published workbooks. No clinical archive or patient index is connected. Atlas, cases and paid lectures keep independent access rules.</p></details>
    </section>
    <nav className="search-kind-nav" aria-label="Filter search results">{searchKinds.map(item => <Link key={item.value} href={searchKindHref(query, item.value)} aria-current={kind === item.value ? 'page' : undefined}>{item.label}</Link>)}</nav>
    <section className="search-results" aria-live="polite">{query.length >= 2 ? <><header><span>{results.length} {results.length === 1 ? "result" : "results"}</span><h2>Results for “{query}”</h2><p>Showing up to 30 matches in {kindLabel}.</p></header>{groups.map(group => <div className="search-group" key={group}><h3>{group}</h3><div>{results.filter(item => item.kind === group).map(item => <div className="search-result-card" key={`${item.kind}:${item.href}:${item.title}`}><Link href={item.href}><span>{item.meta}</span><h4>{item.title}</h4><p>{item.summary}</p><b>{item.kind === "Anatomy concept" ? "Explore structure" : `Open ${item.kind.toLowerCase()}`} →</b></Link>{'learningHref' in item&&typeof item.learningHref==='string'&&item.learningHref.startsWith('/learn/related-structure?')&&<Link className="search-related-link" href={item.learningHref} aria-label={`Related teaching for ${item.title}`}>Related teaching →</Link>}</div>)}</div></div>)}{!results.length && <div className="search-empty"><h3>No {kind === 'all' ? 'anatomy or education content' : kindLabel.toLowerCase()} matched.</h3><p>Try a modality, anatomy region, structure name or course title.</p><div><Link href={searchKindHref(query, 'all')}>Show all kinds →</Link><Link href="/atlas">Browse the Atlas →</Link></div></div>}</> : <div className="search-start"><span>⌕</span><h2>Choose your next learning step.</h2><p>Find a structure, anatomy view, teaching case, course or published workbook.</p><div><b>Anatomy</b><b>Cases</b><b>Courses</b><b>Workbooks</b></div></div>}</section>
  </main>;
}
