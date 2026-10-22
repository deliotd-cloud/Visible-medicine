import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const exactlyOnce=(text,fragment,role)=>assert.equal(text.split(fragment).length-1,1,role);

export function restoreHeadToolsBefore20261022(currentBytes,historicalBytes){
  assert.equal(sha(historicalBytes),'a14d1d851fff12960b35ffe71e282a0f2ec00e9a9077c74e72d3ed456ad25daa','authenticated complete pre-head-tools viewer');
  const historical=historicalBytes.toString();
  let current=currentBytes.toString();
  const paneLabels=[
    [
      '<button type="button" onClick={onExpand} aria-pressed={expanded} aria-label={`${expanded?\'Restore\':\'Enlarge\'} ${plane} image`}>',
      '<button type="button" onClick={onExpand} aria-pressed={expanded}>',
    ],
    [
      '<button type="button" aria-pressed={expanded===\'3d\'} aria-label={`${expanded===\'3d\'?\'Restore\':\'Enlarge\'} selected anatomy 3D scan view`} onClick={()=>setExpanded(expanded===\'3d\'?null:\'3d\')}>',
      '<button type="button" aria-pressed={expanded===\'3d\'} onClick={()=>setExpanded(expanded===\'3d\'?null:\'3d\')}>',
    ],
  ];
  for(const [present,before] of paneLabels){
    exactlyOnce(current,present,'one exact approved pane-label addition');
    exactlyOnce(historical,before,'one exact historical pane action');
    current=current.replace(present,before);
  }
  const oldControls=historical.match(/^    <div className="head-window-controls">.*<\/div>$/m)?.[0];
  assert(oldControls,'historical complete toolbar expression');
  exactlyOnce(historical,oldControls,'one historical toolbar expression');
  const cross='<label><input type="checkbox" checked={showCrosshair} onChange={event=>setShowCrosshair(event.target.checked)}/> Crosshair localizer</label>';
  const regional='{!quizActive&&!!selected?.entry.supplementary_geometries?.length&&<label><input type="checkbox" checked={regionalCourse} onChange={event=>setRegionalCourse(event.target.checked)}/> Regional centreline</label>}';
  for(const control of [cross,regional])exactlyOnce(oldControls,control,'one unchanged historical locator control');
  exactlyOnce(oldControls,'<div><label>Level','one historical disclosure control container');
  const compactControls=oldControls.replace(cross,'').replace(regional,'').replace('<div><label>Level','<div>'+cross+regional+'<label>Level');
  exactlyOnce(current,compactControls,'one exact current compact toolbar expression');
  current=current.replace(compactControls,oldControls);
  assert.equal(current,historical,'complete current viewer reverses only the two pane labels and two locator moves');
  return current;
}
