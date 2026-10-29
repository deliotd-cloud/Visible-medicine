import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const sha=value=>createHash('sha256').update(value).digest('hex');
const fixtures={
  'HeadTeachingReviewNavigator.tsx':'c68d37d8ea10608feac8d71883ef667dd6d74f17220e5256aaaf9187deb4364b',
  'HeadAtlasTeachingReview.tsx':'0683d83e57912d034b39ae3052122597bcf965c693f4e72dc87b87b2da76c1d6',
  'head-teaching-review-navigation.test.ts':'ca82efbcbbeca857d56b82ec1c1ca7b5db9060fbcee48be490e81987034d3e4d',
};
function prior(name){
  const source=readFileSync(new URL(`./fixtures/head-review-sections-before/${name}.raw`,import.meta.url),'utf8');
  assert.equal(sha(source),fixtures[name],`Exact pre-sections source: ${name}`);
  return source;
}
function once(source,from,to){
  assert.equal(source.split(from).length,2,`Unique inverse seam: ${from.slice(0,90)}`);
  return source.replace(from,to);
}
function between(source,start,end){
  const first=source.indexOf(start),last=source.indexOf(end,first+start.length);
  assert(first>=0&&last>first&&source.indexOf(start,first+1)<0,`Bounded inverse span: ${start}`);
  return source.slice(first,last);
}
function exact(name,inverted){
  assert.equal(inverted,prior(name),`Complete pre-sections source: ${name}`);
  return inverted;
}

export function beforeReviewSectionsNavigator(current){
  const previous=prior('HeadTeachingReviewNavigator.tsx');
  current=once(current,between(current,"import type {ReactNode} from 'react';\n",'/** In-page navigation only.'),'\n');
  current=once(current,'    openReviewTarget(form,selected.id);\n',
    between(previous,'    const target=form.ownerDocument.getElementById(selected.id);\n','  }}>'));
  return exact('HeadTeachingReviewNavigator.tsx',current);
}

export function beforeReviewSectionsTeachingReview(current){
  current=once(current,"import {HeadTeachingReviewNavigator,HeadTeachingReviewSections} from './HeadTeachingReviewNavigator';",
    "import {HeadTeachingReviewNavigator} from './HeadTeachingReviewNavigator';");
  current=once(current,'>Source comparisons</a>','>Back to source comparisons</a>');
  current=once(current,'      <HeadTeachingReviewSections>','      <nav aria-label="Head review sections">');
  current=once(current,'      </HeadTeachingReviewSections>','      </nav>');
  return exact('HeadAtlasTeachingReview.tsx',current);
}

export function beforeReviewSectionsNavigationTest(current){
  const previous=prior('head-teaching-review-navigation.test.ts');
  current=once(current,'  return {Component:mod.exports[file],exports:mod.exports,source};',
    '  return {Component:mod.exports[file],source};');
  current=once(current,between(current,"const navigatorModule=component('HeadTeachingReviewNavigator');\n",'type Node='),
    between(previous,"const {Component:Navigator,source:navigatorSource}=component('HeadTeachingReviewNavigator');\n",'type Node='));
  return exact('head-teaching-review-navigation.test.ts',current);
}
