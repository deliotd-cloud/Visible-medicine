import type {Plane} from './head-atlas-geometry.mjs';

export type HeadViewportFrame={zoom:number;pan:{x:number;y:number}};
export const defaultHeadViewportFrame=():HeadViewportFrame=>({zoom:1,pan:{x:0,y:0}});

/** Session-only framing for the currently committed study/selection/attempt. */
export function createHeadViewportMemory(){
  let activeScope:object|null=null;
  const frames=new Map<Plane,HeadViewportFrame>();
  return {
    activate(scope:object){
      if(activeScope===scope)return;
      activeScope=scope;
      frames.clear();
    },
    read(scope:object,plane:Plane):HeadViewportFrame{
      const frame=activeScope===scope?frames.get(plane):undefined;
      return frame?{zoom:frame.zoom,pan:{...frame.pan}}:defaultHeadViewportFrame();
    },
    write(scope:object,plane:Plane,frame:HeadViewportFrame):boolean{
      if(activeScope!==scope)return false;
      frames.set(plane,{zoom:frame.zoom,pan:{...frame.pan}});
      return true;
    },
  };
}

export type HeadViewportMemory=ReturnType<typeof createHeadViewportMemory>;
