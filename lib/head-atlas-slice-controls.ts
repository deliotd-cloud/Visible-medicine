/** Image-focused shortcuts use native slice indices, never inferred patient directions. */
export function headSliceNumber(value:string,sliceCount:number):number|null {
  if(!Number.isSafeInteger(sliceCount)||sliceCount<1||!/^\d+$/.test(value.trim()))return null;
  const number=Number(value.trim());
  return Number.isSafeInteger(number)&&number>=1&&number<=sliceCount?number-1:null;
}

export function headSliceKey(key:string,slice:number,sliceCount:number):number|null {
  if(!Number.isSafeInteger(sliceCount)||sliceCount<1||!Number.isSafeInteger(slice)||slice<0||slice>=sliceCount)return null;
  switch(key){
    case 'PageUp':return Math.max(0,slice-1);
    case 'PageDown':return Math.min(sliceCount-1,slice+1);
    case 'Home':return 0;
    case 'End':return sliceCount-1;
    default:return null;
  }
}
