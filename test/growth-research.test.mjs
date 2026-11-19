import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {config,keywordPlan} from '../scripts/growth/config.mjs';
import {reportingWindows,localePageFilter,matchesLocalePage,normalizeRow,comparison} from '../scripts/growth/library.mjs';
import {collectPeriod,collectGrowth} from '../scripts/growth/collect.mjs';
import {validateGumOperation,createGumReader} from '../scripts/growth/gum.mjs';
import {collectKeywords,loadKeywordCache} from '../scripts/growth/keywords.mjs';

const temporary=async fn=>{const directory=await mkdtemp(join(tmpdir(),'mockupkit-research-'));try{await fn(directory);}finally{await rm(directory,{recursive:true,force:true});}};
test('single-language research covers the canonical site without an empty exclusion regex',()=>{
 const filter=localePageFilter('en');assert.equal(filter.operator,'includingRegex');
 const regex=new RegExp(filter.expression);
 for(const path of ['', 'blog/', 'blog/example/'])assert.equal(regex.test(config.siteUrl+path),true);
 assert.equal(regex.test('https://mockupkits.com.evil/blog/'),false);
 assert.equal(matchesLocalePage('https://other.example/blog/','en'),false);
 assert.throws(()=>localePageFilter('fr'));
 const plan=keywordPlan('en');assert.equal(plan.seedUrl,'https://mockupkits.com/blog/');assert.deepEqual(plan.targeting.geoTargetConstants,[]);assert.equal(plan.targeting.network,'GOOGLE_SEARCH');assert.equal(plan.targeting.languageConstant,'languageConstants/1000');
});
test('reporting periods are two complete non-overlapping Pacific windows with a final-data buffer',()=>{
 const result=reportingWindows(new Date('2026-11-19T01:00:00Z'));
 assert.deepEqual(result,{current:{startDate:'2026-10-19',endDate:'2026-11-15'},previous:{startDate:'2026-09-21',endDate:'2026-10-18'}});
 assert.equal(normalizeRow({}).clicks,null);assert.equal(comparison(null,null).status,'unavailable');
});
test('collector pages all rows, requests separate totals, and refuses incomplete pagination',async()=>{
 const calls=[],row=query=>({keys:[query,config.siteUrl+'blog/','MOBILE','usa'],clicks:1,impressions:10,ctr:0.1,position:5});
 const call=async(_operation,args)=>{calls.push(args);return args.body.dimensions.length?{rows:args.body.startRow===0?[row('first'),row('second')]:[row('third')]}:{rows:[{clicks:3,impressions:30,ctr:0.1,position:5}]};};
 const period=await collectPeriod('en',{startDate:'2026-10-01',endDate:'2026-10-28'},call,{pageSize:2,maxRows:10});
 assert.equal(period.rows.length,3);assert.equal(period.totals.clicks,3);assert.equal(period.paginationComplete,true);assert.deepEqual(calls.map(item=>item.body.startRow),[0,2,0]);
 await assert.rejects(collectPeriod('en',{},async()=>({rows:[row('a'),row('b')]}),{pageSize:2,maxRows:2}),/pagination limit/);
 await assert.rejects(collectPeriod('en',{},async()=>({rows:[],metadata:{first_incomplete_date:'2026-10-28'}})),/incomplete/);
});
test('Gum adapter permits only the configured property and read-only keyword operations',()=>{
 assert.equal(validateGumOperation('searchconsole.searchanalytics.query',{siteUrl:config.siteUrl}),'mockupkit-searchconsole');
 assert.throws(()=>validateGumOperation('searchconsole.searchanalytics.query',{siteUrl:'https://other.example/'}));
 assert.throws(()=>validateGumOperation('googleads.campaigns.mutate',{}));
 const args={keywordPlanNetwork:'GOOGLE_SEARCH',geoTargetConstants:[],language:'languageConstants/1000'};
 assert.equal(validateGumOperation('googleads.keywordPlanIdeas.generateKeywordIdeas',args),'mockupkit-keywords');
 for(const bad of [{...args,geoTargetConstants:['geoTargetConstants/2840']},{...args,keywordPlanNetwork:'GOOGLE_SEARCH_AND_PARTNERS'},{...args,language:'languageConstants/1002'}])assert.throws(()=>validateGumOperation('googleads.keywordPlanIdeas.generateKeywordIdeas',bad));
});
test('structured transient reads retry while auth failures never loop',async()=>{
 let count=0;
 const reader=createGumReader({wait:async()=>{},execute:()=>++count===1?{status:1,stdout:JSON.stringify({error_code:'CANCELLED'}),stderr:''}:{status:0,stdout:JSON.stringify({data:{rows:[]}})}});
 assert.deepEqual(await reader('searchconsole.searchanalytics.query',{siteUrl:config.siteUrl}),{rows:[]});assert.equal(count,2);
 count=0;const denied=createGumReader({wait:async()=>{},execute:()=>{count++;return {status:1,stdout:JSON.stringify({error_code:'PERMISSION_DENIED'}),stderr:'access denied'};}});
 await assert.rejects(denied('searchconsole.searchanalytics.query',{siteUrl:config.siteUrl}),/access denied/);assert.equal(count,1);
});
test('keyword cache has authentic targeting, reuses fresh research and retains it on failed refresh',async()=>temporary(async directory=>{
 let calls=0;const now=new Date('2026-11-19T10:00:00Z');
 const options={directory,now,settings:{customerId:'1234567890',accessStatus:'ready'},call:async()=>{calls++;return {results:[{text:'app store screenshots on mac',keywordMetrics:{avgMonthlySearches:'120'}}]};}};
 assert.equal((await collectKeywords('en',options)).status,'ready');assert.ok(calls>=2);
 const cache=loadKeywordCache('en',now,directory);assert.equal(cache.targeting.geography,'WORLDWIDE');assert.equal(cache.keywords[0].averageMonthlySearches,120);
 const before=calls;assert.equal((await collectKeywords('en',options)).reusedCache,true);assert.equal(calls,before);
 assert.equal((await collectKeywords('en',{...options,refresh:true,call:async()=>{throw Error('unavailable');}})).status,'action-required');
 assert.equal(loadKeywordCache('en',now,directory).keywords[0].averageMonthlySearches,120);
 assert.equal((await stat(join(directory,'keyword-cache-en.json'))).mode&0o077,0);
}));
test('fixtures stay explicitly marked and cannot masquerade as a live latest report',async()=>temporary(async directory=>{
 const report=await collectGrowth({directory,fixture:{markets:{en:{current:{rows:[]},previous:{rows:[]}}}}});
 assert.equal(report.fixture,true);assert.equal(report.markets.en.status,'no-data-yet');assert.equal(report.markets.en.current.totals,null);
 assert.equal(JSON.parse(await readFile(join(directory,'trial-fixture.json'),'utf8')).fixture,true);
 await assert.rejects(readFile(join(directory,'latest.json')),{code:'ENOENT'});
}));
