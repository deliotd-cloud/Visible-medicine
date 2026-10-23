import assert from 'node:assert/strict';

const laterFocusSeams=[
 ["    useRef(initial) { const slot = editorCursor++; return editorSlots[slot] ??= {current: initial}; },\n",'' ],
 ["    toggle.props.onClick({currentTarget:{closest:()=>({open:true,querySelector:()=>({focus(){}})})}});",
  '    toggle.props.onClick();'],
 ["    walk(opened, node => node.props['aria-controls'] === 'course-details-editor').props.onClick({currentTarget:{closest:()=>({open:true,querySelector:()=>({focus(){}})})}});",
  "    walk(opened, node => node.props['aria-controls'] === 'course-details-editor').props.onClick();"],
];

export function reconstructCourseDetailsBeforeFocus(current,expectedPrior){
 let prior=current.replaceAll('\r\n','\n');
 for(const [later,earlier] of laterFocusSeams){
  assert.equal(prior.split(later).length,2,'One exact later focus seam: '+later.slice(0,60));
  if(earlier)assert.equal(prior.split(earlier).length,1,'Earlier click already present');
  prior=prior.replace(later,earlier);
 }
 if(expectedPrior!==undefined)assert.equal(prior,expectedPrior,'Whole before-focus source restored');
 return prior;
}
