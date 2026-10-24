import test from 'node:test';import assert from 'node:assert/strict';
import {allowedProposalSourceArtifact} from './source-proposal-checkpoint.mjs';
test('explicit source styles and exact product manifests, never arbitrary generated/data formats',()=>{
 for(const name of ['atlas/app/practice-action-bar.css','atlas/package.json','website/package.json','atlas/scripts/test-practice-action-bar.mjs','atlas/app/practice-action-bar.tsx','preimage.mjs.raw'])assert(allowedProposalSourceArtifact(name),name);
 for(const name of ['atlas/content/review-revisions.json','atlas/package-lock.json','arbitrary/package.json','source-inputs.json','models/body.glb','case.dcm','private-reference.pdf','image.png','style.css.map','data.csv','styles.css?download'])assert(!allowedProposalSourceArtifact(name),name);
});
