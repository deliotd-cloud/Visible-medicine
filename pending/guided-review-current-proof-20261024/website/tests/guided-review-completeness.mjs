import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {assertCurrentGuidedReviewAdditions} from './tour-playback-source-role.mjs';

const wireSha=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const renalToursSha='446f2e8e18a60fee7a1e98281263c090a2e3f45109e94531ea055471fd28bc75';
const currentToursSha='8d838d7f227986875dfb42234d5c7001301f3016c604fb2f8af57ed171899498';
const members=tour=>[...tour.contextIds,...tour.steps.map(step=>step.selectedId)];

/** An independent completeness gate supplements (never replaces) the old theorem.
 * Membership comes from the entire authenticated tour, not the packets supplied
 * by the caller: an empty, partial or wrong-side packet list cannot select its
 * own expected answer. Historical guide bodies remain byte-exact comparisons.
 */
export function assertCompleteGuidedReview(structureId,renalGuides,currentGuides,currentTours){
 assert.equal(typeof structureId,'string');assert(structureId.length>0);
 assert(Array.isArray(renalGuides)&&Array.isArray(currentGuides)&&Array.isArray(currentTours));
 assert.equal(currentTours.length,53);
 assert.equal(currentTours.reduce((n,t)=>n+t.steps.length,0),317);
 assert.equal(wireSha(currentTours),currentToursSha,'Complete current tour bank');
 assert.equal(wireSha(currentTours.slice(0,51)),renalToursSha,'Complete historical renal prefix');
 const expected=currentTours.filter(tour=>members(tour).includes(structureId)).map(tour=>tour.id);
 const historical=currentTours.slice(0,51).filter(tour=>members(tour).includes(structureId)).map(tour=>tour.id);
 assert.deepEqual(renalGuides.map(guide=>guide.tour.id),historical,'Complete historical membership, in order');
 assert.deepEqual(currentGuides.map(guide=>guide.tour.id),expected,'Every required guide, in source order');
 const added=assertCurrentGuidedReviewAdditions(renalGuides,currentGuides,currentTours);
 assert.deepEqual(added,expected.slice(historical.length),'All and only new structure-specific guide packets');
 return {guideIds:expected,addedIds:added};
}
