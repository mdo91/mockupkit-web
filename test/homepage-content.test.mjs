import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parse} from 'parse5';

const facts=JSON.parse(readFileSync('src/content/product-facts.json','utf8'));
function inspect(source){
 const rows=[];
 function visit(node,ancestors=[]){rows.push({node,ancestors});for(const child of node.childNodes||[])visit(child,[...ancestors,node]);}
 visit(parse(source));return rows;
}
const attr=(node,key)=>node.attrs?.find(value=>value.name===key)?.value;
const text=node=>node.value||node.childNodes?.map(text).join('')||'';
const visible=row=>![...row.ancestors,row.node].some(node=>['script','style','template'].includes(node.tagName)||node.attrs?.some(value=>value.name==='hidden')||attr(node,'aria-hidden')==='true');

test('homepage gives every maintained capability visible content with its actual release availability',()=>{
 const rows=inspect(readFileSync('index.html','utf8'));
 for(const capability of facts.capabilities){
  const card=rows.find(row=>attr(row.node,'data-capability')===capability.id&&visible(row));
  assert.ok(card,`Missing visible capability: ${capability.id}`);
  assert.ok(card.node.childNodes?.some(child=>child.tagName==='h3'&&text(child).trim()),`${capability.id} needs a useful heading`);
  assert.ok(text(card.node).trim().length>60,`${capability.id} needs explanatory content`);
  const release=[...card.ancestors,card.node].find(node=>attr(node,'data-release'));
  if(capability.availability==='available')assert.equal(release,undefined,`${capability.id} must not be described as upcoming`);
  else{
   assert.equal(attr(release,'data-release'),facts.release.version);
   assert.equal(attr(release,'data-availability'),facts.release.publicAvailabilityVerified?'available':'upcoming');
   assert.match(text(release),facts.release.publicAvailabilityVerified?/./:/Coming in version/);
  }
 }
});

test('homepage keeps the configured Google tag and single canonical download destination',()=>{
 const rows=inspect(readFileSync('index.html','utf8'));
 const google=rows.filter(({node})=>node.tagName==='script'&&attr(node,'src')?.startsWith('https://www.googletagmanager.com/gtag/js?'));
 assert.equal(google.length,1);assert.equal(new URL(attr(google[0].node,'src')).searchParams.get('id'),'AW-18339507708');
 const scripts=rows.filter(({node})=>node.tagName==='script'&&!attr(node,'src')&&attr(node,'type')!=='application/ld+json').map(({node})=>text(node)).join('\n');
 assert.match(scripts,/gtag\('config', 'AW-18339507708'\)/);
 const downloads=rows.filter(({node})=>node.tagName==='a'&&attr(node,'href')?.startsWith('https://apps.apple.com/'));
 assert.ok(downloads.length>0);assert.ok(downloads.every(({node})=>attr(node,'href')===facts.appStoreUrl));
});
