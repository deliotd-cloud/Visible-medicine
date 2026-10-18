import type {RegionalTour} from './regional-tours';

const liver='vm:anatomy:body:abdomen:unpaired:organ:liver';
// The gallbladder's public ID is historical; its catalogue region is abdomen.
const gallbladder='vm:anatomy:body:pelvis:unpaired:organ:gallbladder';
const cysticDuct='vm:anatomy:body:abdomen:unpaired:organ:cystic-duct';
const commonHepaticDuct='vm:anatomy:body:abdomen:unpaired:organ:common-hepatic-duct';
const reference='https://anatomy.ttuhscep.edu/schemes/liver_tables.html';
const stop=(id:string,title:string,selectedId:string,view:RegionalTour['steps'][number]['view'],frameIds:string[],caption:string):RegionalTour['steps'][number]=>({
  id,title,selectedId,view,frameIds,caption,references:[reference],durationMs:14000,fadeOthers:true,
});

export const hepatobiliaryTour:RegionalTour={
  id:'hepatobiliary-surface-orientation',title:'Liver, gallbladder & selected ducts',region:'abdomen',
  revision:'hepatobiliary-surface-orientation-v1',status:'draft',
  description:'Four source-bound stops orient the liver and gallbladder before comparing two separately selectable exterior duct segments.',
  limitations:'Selected exterior source segments only, not a complete biliary tree. Right and left hepatic ducts, common bile duct, ampulla and duodenal papilla are not separately selectable here. The supplied surfaces do not validate a lumen, duct continuity, diameter, stones, bile flow or an operative safety plane. No patient image registration. Draft pending revision-bound radiologist sign-off. Atlas, cases and lectures retain independent access.',
  contextIds:[],
  requiredDisplayBundles:{
    [liver]:'abdomen-organs',
    [gallbladder]:'pelvis-organs',
    [cysticDuct]:'abdomen-organs-inventory',
    [commonHepaticDuct]:'abdomen-organs-inventory',
  },
  steps:[
    stop('liver-overview','Liver · Overview',liver,'anterior',[liver,gallbladder],
      'Begin with the liver exterior. The gallbladder lies beneath its lower surface in usual anatomy; compare the two source surfaces without inferring a complete biliary tree.'),
    stop('gallbladder-undersurface','Gallbladder · Undersurface',gallbladder,'inferior',[gallbladder,cysticDuct],
      'Turn beneath the liver region to locate the gallbladder. Its neck normally continues into the cystic duct, but this view does not establish an exact junction.'),
    stop('cystic-duct','Cystic duct · Close-up',cysticDuct,'anterior',[cysticDuct,commonHepaticDuct],
      'Isolate the cystic duct surface beside the common hepatic duct. These ducts usually join; the supplied segments do not verify the point of union or a continuous lumen.'),
    stop('common-hepatic-duct','Common hepatic duct · Comparison',commonHepaticDuct,'anterior',[commonHepaticDuct,cysticDuct],
      'Compare the common hepatic duct with the cystic duct in the same close frame. The common hepatic duct normally arises from right and left hepatic ducts, which are not separately selectable here.'),
  ],
};
