import {Vector3,Quaternion,MathUtils} from 'three';
// Same eased orbit in either pane: no linear chord through the model.
export function opticCameraArc(fromPosition,fromTarget,toTarget,direction,distance,t){
 if(!Number.isFinite(t)||t<0||t>1||!Number.isFinite(distance)||distance<=0)throw Error('Invalid camera arc');
 const from=new Vector3(...fromPosition).sub(new Vector3(...fromTarget)),to=new Vector3(...direction);
 if(!from.length()||!to.length())throw Error('Empty camera direction');
 const s=t*t*(3-2*t),target=new Vector3(...fromTarget).lerp(new Vector3(...toTarget),s);
 const rotation=new Quaternion().setFromUnitVectors(from.clone().normalize(),to.normalize());
 const position=from.clone().normalize().applyQuaternion(new Quaternion().slerp(rotation,s)).multiplyScalar(MathUtils.lerp(from.length(),distance,s)).add(target);
 return {position:position.toArray(),target:target.toArray()};
}
