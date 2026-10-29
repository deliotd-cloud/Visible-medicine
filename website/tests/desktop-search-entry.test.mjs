import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import test from 'node:test';

const read=path=>readFileSync(fileURLToPath(new URL(path,import.meta.url)),'utf8').replace(/\r\n/g,'\n');
const hash=value=>createHash('sha256').update(value).digest('hex');
// The original search-only inverse is preserved after removing the separately
// behavior-tested workspace focus addition, without rebasing its expected hash.
const workspaceBlur=" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) closeWorkspace(); }}";
const currentHeader=read('../components/SiteHeader.tsx');
assert.equal(currentHeader.split(workspaceBlur).length,2,'one workspace focus handler');
const header=currentHeader.replace(workspaceBlur,'');
// The full-source CSS inverse belongs to the search milestone. Subsequent
// unrelated styles are checked separately against the current scoped contract.
const css=read('./fixtures/desktop-search-entry-original.css');
assert.equal(hash(css),'597f2582fdeadee79130d58c179755888e21db05b7a3a9b7d1e7ae61a4d3a1e7','historical CSS provenance');
const currentCss=read('../app/globals.css');
const beforeHeaderHash='f989c863450e3338c5b9d757016afe927013489e662edc587b86e0a0f3d5011a';
const beforeCssHash='d7c1b64d1a4f11f88125a376ef6d7524eaf178c949e553afb2f3d06daee4cbd8';
const oldLink='<Link className="search-link" href="/search" aria-label="Search Visible Medicine" aria-current={pathname === "/search" ? "page" : undefined}>⌕ <span>Search</span></Link>';
const newLink='<Link className="search-link" href="/search" aria-label="Search Visible Medicine" title="Search Visible Medicine" aria-current={pathname === "/search" ? "page" : undefined}><svg aria-hidden="true" focusable="false" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.3 4.3"/></svg><span>Search</span></Link>';
const cssAddition='\n@media (min-width: 1000px) and (max-width: 80rem) {\n  .public-platform-header .search-link { display: inline-flex; flex: 0 0 42px; width: 42px; padding: 0; }\n  .public-platform-header .search-link span { display: none; }\n}\n.public-platform-header .search-link:focus-visible { outline: 2px solid var(--teal); outline-offset: 2px; }\n';

test('only the public Search link changes; route, label, keyboard name and drawer search remain',()=>{
  assert.equal(header.split(newLink).length,2,'one public search link');
  assert.match(newLink,/href="\/search"/);
  assert.match(newLink,/aria-label="Search Visible Medicine"/);
  assert.match(newLink,/title="Search Visible Medicine"/);
  assert.match(newLink,/<svg aria-hidden="true" focusable="false"/);
  assert.match(newLink,/aria-current=\{pathname === "\/search" \? "page" : undefined\}/);
  assert.match(header,/const secondaryLinks = \[\s*\["Search", "\/search"\]/);
  assert.match(header,/secondaryLinks\.map\(\(\[label, href\]\) =>/);
  assert.equal(hash(header.replace(newLink,oldLink)),beforeHeaderHash,'all other JSX, destinations, menus and functions preserved');
});

test('later desktop rule overrides both hides with compact search; mobile drawer and every other rule preserved',()=>{
  assert.equal(css.split(cssAddition).length,2,'one scoped CSS addition');
  assert.equal(hash(css.replace(cssAddition,'')),beforeCssHash,'full CSS source inverse');
  const earlierHide=css.indexOf('.public-platform-header .search-link { display: none; }');
  const genericHide=css.indexOf('.search-link { display: none; }');
  const compact=css.indexOf(cssAddition);
  assert(earlierHide>=0&&genericHide>=0&&compact>earlierHide&&compact>genericHide);
  assert.match(cssAddition,/@media \(min-width: 1000px\) and \(max-width: 80rem\)/);
  assert.match(cssAddition,/\.public-platform-header \.search-link \{ display: inline-flex; flex: 0 0 42px; width: 42px; padding: 0; \}/);
  assert.match(cssAddition,/\.public-platform-header \.search-link span \{ display: none; \}/);
  assert.match(cssAddition,/\.public-platform-header \.search-link:focus-visible \{ outline: 2px solid var\(--teal\)/);
  assert.match(css,/@media \(max-width: 840px\) \{\n  \.topbar\.public-platform-header \{ gap: 12px; \}\n  \.public-platform-header \.public-primary-nav,\n  \.public-platform-header \.search-link \{ display: none; \}/);
});

test('current desktop search styles retain visibility, compact width and keyboard focus rules',()=>{
  assert.equal(currentCss.split(cssAddition).length,2,'one scoped CSS addition');
  const earlierHide=currentCss.indexOf('.public-platform-header .search-link { display: none; }');
  const genericHide=currentCss.indexOf('.search-link { display: none; }');
  const compact=currentCss.indexOf(cssAddition);
  assert(earlierHide>=0&&genericHide>=0&&compact>earlierHide&&compact>genericHide);
  assert.match(cssAddition,/@media \(min-width: 1000px\) and \(max-width: 80rem\)/);
  assert.match(cssAddition,/\.public-platform-header \.search-link \{ display: inline-flex; flex: 0 0 42px; width: 42px; padding: 0; \}/);
  assert.match(cssAddition,/\.public-platform-header \.search-link span \{ display: none; \}/);
  assert.match(cssAddition,/\.public-platform-header \.search-link:focus-visible \{ outline: 2px solid var\(--teal\)/);
  assert.match(currentCss,/@media \(max-width: 840px\) \{\n  \.topbar\.public-platform-header \{ gap: 12px; \}\n  \.public-platform-header \.public-primary-nav,\n  \.public-platform-header \.search-link \{ display: none; \}/);
});
