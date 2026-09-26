import { nestedBundleHash, nestedPartsFor, type NestedStudy } from './nested-anatomy';
import { sourceCanonical } from './body-source-additions';
import type { BodyStructure } from '../app/body-types';
import bindings from '../content/nested-review-bindings.json';
/** Frozen source token binds parent/child records, both bundles, frame and study.
 * Current server material must match it before opening a selected worksheet. */
export function nestedReviewHref(parent:BodyStructure,study:NestedStudy,child:BodyStructure) {
  const canonical=nestedPartsFor(parent,study).find(s=>s.id===child.id);
  const source=nestedBundleHash(study,child.bundle);
  if(!canonical||!source||sourceCanonical(canonical)!==sourceCanonical(child))return null;
  const group=bindings.groups.find(g=>g.study===study&&g.parent.id===parent.id&&sourceCanonical(g.parent)===sourceCanonical(parent));
  const pin=group?.selections.find(s=>s.id===child.id&&s.childBundleHash===source);
  return pin?'/workspace/atlas-review/nested?'+new URLSearchParams({parent:parent.id,study,structure:child.id,source:pin.sourceToken}).toString():null;
}
