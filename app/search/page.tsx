import type { Metadata } from "next";
import Link from "next/link";
import { searchEducation } from "@/lib/platform-governance";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Search", description: "Search Visible Medicine anatomy, cases, courses and workbooks." };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const query = (await searchParams).q?.trim() ?? "";
  const results = await searchEducation(query);
  const groups = [...new Set(results.map((item) => item.kind))];
  return <main className="inner-page search-page">
    <section className="search-hero"><p className="eyebrow"><span /> Unified education search</p><h1>Find anatomy, cases and learning.</h1><form role="search"><label htmlFor="education-search">Search published education content</label><div><input id="education-search" name="q" type="search" defaultValue={query} placeholder="Try lateral ventricle, CT, neuroanatomy…" minLength={2} autoFocus /><button type="submit">Search <span>→</span></button></div></form><p>Searches reviewed Atlas structures, teaching cases, courses and published workbooks. No clinical archive or patient index is connected.</p></section>
    <section className="search-results" aria-live="polite">{query.length >= 2 ? <><header><span>{results.length} results</span><h2>Results for “{query}”</h2></header>{groups.map((group) => <div className="search-group" key={group}><h3>{group}</h3><div>{results.filter((item) => item.kind === group).map((item) => <Link href={item.href} key={`${item.kind}:${item.href}:${item.title}`}><span>{item.meta}</span><h4>{item.title}</h4><p>{item.summary}</p><b>Open {item.kind.toLowerCase()} →</b></Link>)}</div></div>)}{!results.length && <div className="search-empty"><h3>No published education content matched.</h3><p>Try a modality, anatomy region, structure name or course title.</p><Link href="/atlas">Browse the Atlas →</Link></div>}</> : <div className="search-start"><span>⌕</span><h2>One index, four learning surfaces.</h2><p>Search structure labels and synonyms, Atlas modules, curated teaching cases, courses and institution workbooks.</p><div><b>Structures</b><b>Atlas</b><b>Courses</b><b>Workbooks</b></div></div>}</section>
  </main>;
}
