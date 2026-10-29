import React from 'react';
import {createRoot} from 'react-dom/client';
import {CourseCatalogue} from '../20261029-combined-website/website/components/CourseCatalogue';
import {parseCourseCatalogueFilters} from '../20261029-combined-website/website/lib/course-catalogue-filters';

const subjects=[
  ['ct-mri','CT/MRI Brain','Foundation','free','official'],
  ['xray','X-ray Fundamentals','Foundation','free','official'],
  ['shoulder','Shoulder Anatomy','Advanced','institution','institution'],
  ['mri','MRI Head','Advanced','invitation','institution'],
] as const;
const courses=subjects.map(([slug,title,level,accessModel,publisherKind],i)=>({
  id:slug,courseId:slug,code:slug,slug,title,summary:'Synthetic course for browser testing only.',
  level,accessModel,publisherKind,duration:'10 min',outcomes:[],publisher:'Synthetic publisher',
  visibility:'public',priceMinor:0,currency:'GBP',enrolmentOpen:false,status:'published',version:1,
  publishedAt:`2026-10-${String(i+1).padStart(2,'0')}`,workbookCount:1,
  firstWorkbookId:null,resumeWorkbookId:null,liveWorkbookId:null,liveStartedAt:null,enrolled:false,
}));
const initialFilters=parseCourseCatalogueFilters(new URLSearchParams(location.search),courses.map(course=>course.level));
createRoot(document.getElementById('root')!).render(<CourseCatalogue courses={courses} profile={null} initialFilters={initialFilters}/>);
