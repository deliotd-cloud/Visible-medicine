import {HEAD_LEARNING_BOOKMARK_KEY,parseHeadLearningBookmark,resolveHeadLearningBookmark} from './head-learning-bookmark.ts';
import {HEAD_STUDY_PLAN_KEY,parseHeadStudyPlan} from './head-study-plan.ts';

export {HEAD_LEARNING_BOOKMARK_KEY,HEAD_STUDY_PLAN_KEY};

export type BrowserAtlasResumeState={
  tour:{kind:'empty'|'unavailable'|'ready';sequenceLabel?:string;step?:number;total?:number;label?:string;
    links?:{atlasHref?:string;ctHref?:string;mriHref?:string}};
  plan:{kind:'empty'|'unavailable'|'ready';count?:number};
};

/** The stored strings are never rendered or used as destinations. */
export function resolveBrowserAtlasResume(bookmarkRaw:string|null,planRaw:string|null):BrowserAtlasResumeState{
  const bookmark=bookmarkRaw===null?null:parseHeadLearningBookmark(bookmarkRaw);
  const navigation=bookmark?resolveHeadLearningBookmark(bookmark):null;
  const plan=planRaw===null?null:parseHeadStudyPlan(planRaw);
  return {
    tour:navigation?{kind:'ready',sequenceLabel:navigation.sequenceLabel,step:navigation.index+1,
      total:navigation.total,label:navigation.label,links:navigation.current}:
      {kind:bookmarkRaw===null?'empty':'unavailable'},
    plan:plan?{kind:'ready',count:plan.conceptIds.length}:
      {kind:planRaw===null?'empty':'unavailable'},
  };
}
