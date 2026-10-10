import {Vector3, Quaternion, MathUtils} from 'three';

// A queued RAF timestamp can precede an input event's performance.now().
export function candidateCameraProgress(frameTime,startTime,duration=750){
  if(![frameTime,startTime,duration].every(Number.isFinite)||duration<=0)throw Error('Invalid camera clock');
  return Math.max(0,Math.min(1,(frameTime-startTime)/duration));
}

// Travel around the target on a spherical arc; an opposite preset never cuts through the object.
export function candidateCameraArc(fromPosition, fromTarget, toTarget, toDirection, toDistance, t) {
  if (!Number.isFinite(t) || t < 0 || t > 1 || !Number.isFinite(toDistance) || toDistance <= 0) throw Error('Invalid camera arc');
  const from = new Vector3(...fromPosition).sub(new Vector3(...fromTarget));
  const direction = new Vector3(...toDirection);
  if (!from.length() || !direction.length() || ![...fromPosition,...fromTarget,...toTarget,...toDirection].every(Number.isFinite)) throw Error('Invalid camera vector');
  const eased = t*t*(3-2*t), target = new Vector3(...fromTarget).lerp(new Vector3(...toTarget),eased);
  const turn = new Quaternion().setFromUnitVectors(from.clone().normalize(),direction.normalize());
  const offset = from.clone().normalize().applyQuaternion(new Quaternion().slerp(turn,eased))
    .multiplyScalar(MathUtils.lerp(from.length(),toDistance,eased));
  return {position:offset.add(target).toArray(),target:target.toArray()};
}

// Keep one label wholly within the projected object's half of the viewport.
export function candidateLabelPlacement(width,height,pointX,pointY,labelHeight=40,labelWidth=220) {
  if (![width,height,pointX,pointY,labelHeight,labelWidth].every(Number.isFinite) || width <= 32 || height <= 32) throw Error('Invalid label viewport');
  const side=pointX < width/2 ? 'left':'right', margin=8;
  const maxWidth=Math.max(1,Math.min(220,width/2-margin*2));
  const actualWidth=Math.max(1,Math.min(labelWidth,maxWidth));
  const left=side==='left'?margin:width-margin-actualWidth;
  const top=Math.max(margin,Math.min(height-labelHeight-margin,pointY-labelHeight/2));
  return {side,left,top,maxWidth,actualWidth,edgeX:side==='left'?left+actualWidth:left,edgeY:top+labelHeight/2,
    pointX:Math.max(0,Math.min(width,pointX)),pointY:Math.max(0,Math.min(height,pointY))};
}
