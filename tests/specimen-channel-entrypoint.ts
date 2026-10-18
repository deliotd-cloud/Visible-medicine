import assert from 'node:assert/strict';

/** Preserve the historical entrypoint exactly except the two audited channel additions. */
export function specimenChannelEntrypoint(original:string,name:string):string{
 if(name!=='lower-limb')return original;
 const declaration="import './panel-host.css';\n",view='    </section> : <KneeSpecimenView key={scope} specimen={limbDefinitions[scope]} assetBase={assetBase}\n';
 assert.equal(original.split(declaration).length,2,'one historical declaration anchor');
 assert.equal(original.split(view).length,2,'one historical specimen view anchor');
 assert(!original.includes('__VM_SPECIMEN_SOURCE_REVISION__'),'historical source precedes opt-in channel');
 return original.replace(declaration,declaration+'declare const __VM_SPECIMEN_SOURCE_REVISION__: string;\n')
  .replace(view,view+'      selectionChannelRevision={__VM_SPECIMEN_SOURCE_REVISION__}\n');
}
