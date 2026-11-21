import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {config,validatePublicationPolicy} from '../scripts/growth/config.mjs';

test('publication policy enables bounded automatic review while retaining its owner and pending-work schedule',()=>{
 const policy=structuredClone(config.publication);
 assert.equal(validatePublicationPolicy(policy),policy);
 for(const change of [value=>value.mode='unchecked',value=>value.mode='human-approval',value=>value.maxReviewAttempts=3,value=>value.maxReviewAttempts=0,value=>value.approvers=['someone-else'],value=>value.approvers.push('someone-else'),value=>value.pendingOnlyUtcCron='* * * * *']){
  const invalid=structuredClone(policy);change(invalid);
  assert.throws(()=>validatePublicationPolicy(invalid),/publication review policy/);
 }
 for(const value of [null,[],{},'automated-review'])assert.throws(()=>validatePublicationPolicy(value),/publication review policy/);
});

test('dated public release availability is tied to official Mac App Store evidence rather than a source merge',()=>{
 const facts=JSON.parse(readFileSync('src/content/product-facts.json','utf8'));
 const proof=JSON.parse(readFileSync('docs/app-store-release-2026-11-21.json','utf8'));
 const source=new URL(proof.source);
 assert.equal(source.protocol,'https:');assert.equal(source.hostname,'itunes.apple.com');assert.equal(source.pathname,'/lookup');
 assert.equal(source.searchParams.get('id'),'6784220988');assert.equal(source.searchParams.get('country'),'us');
 assert.equal(proof.trackId,6784220988);assert.equal(proof.kind,'mac-software');assert.equal(proof.storefront,'us');
 assert.equal(proof.version,'2.6.0');assert.equal(proof.currentVersionReleaseDate,'2026-11-19T22:16:52Z');
 assert.equal(facts.release.status,'released');assert.equal(facts.release.publicAvailabilityVerified,true);
 assert.equal(facts.release.publicVersion,proof.version);assert.equal(facts.release.publicReleaseDate,proof.currentVersionReleaseDate);
 assert.equal(facts.release.publicAvailabilityVerifiedAt,proof.checkedAt);assert.equal(facts.release.publicAvailabilitySource,proof.source);
 for(const id of ['headers-search-assets','store-preview','creative-preflight']){
  const capability=facts.capabilities.find(value=>value.id===id);
  assert.equal(capability.availability,'available');assert.equal(capability.verifiedInVersion,proof.version);
 }
 assert.ok(facts.sources.some(value=>value.url===proof.source&&value.checkedAt===proof.checkedAt));
 assert.equal(facts.verifiedAt,'2026-11-19','Native capability evidence retains its original observation date');
 assert.ok(facts.constraints.some(value=>/saving and reopening project files is not yet available/i.test(value)));
});

test('research privacy explains automated review without promising universal human approval or changing existing data controls',()=>{
 const privacy=readFileSync('growth-research-privacy.html','utf8');
 assert.equal(config.publication.mode,'automated-review');
 assert.match(privacy,/separate automated editorial review using that existing managed provider/);
 assert.match(privacy,/Automated approval applies to the exact article revision alongside required website checks/);
 assert.match(privacy,/The owner may also review a revision through the human-approval route/);
 assert.match(privacy,/automated approval is not human sign-off/);
 assert.doesNotMatch(privacy,/A human reviews and approves article revisions before publication/);
 for(const promise of [
  'Query text is not guaranteed to be anonymous.',
  'OAuth credentials are excluded from model inputs.',
  'The runner does not train or fine-tune models;',
  'OpenAI’s processing follows its applicable terms and the subscription account’s data controls.',
  'there is no single automatic deletion period for all records.',
  'Revocation does not automatically delete cached research, operating history, or published guides.'
 ])assert.ok(privacy.includes(promise),`Existing privacy statement was lost: ${promise}`);
});
