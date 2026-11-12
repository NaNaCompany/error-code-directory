import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';
import {prepare,find,codeForms} from '../src/search.mjs';import {HEAD,IDS} from '../src/publisher.mjs';
const rows=JSON.parse(fs.readFileSync(new URL('../data/catalog.json',import.meta.url),'utf8')),prepared=prepare(rows);
test('exact code, HRESULT, pasted message and namespace filtering',()=>{
 const h=find(prepared,{query:'0x80070005'});assert.equal(h.records[0].product,'Windows Win32');assert.equal(h.records[0].code,'5');
 assert.equal(find(prepared,{query:'Access failed with ERROR_ACCESS_DENIED while saving'}).records[0].code,'5');
 assert.equal(find(prepared,{query:'Request failed: AADSTS50076. Please authenticate.'}).records[0].code,'AADSTS50076');
 assert.equal(find(prepared,{query:'23505',product:'PostgreSQL'}).records[0].code,'23505');
 assert.equal(find(prepared,{query:'SQLITE_BUSY',product:'SQLite'}).records[0].code,'SQLITE_BUSY');
 const m=find(prepared,{query:'1603',product:'Windows Installer 메시지'}).records[0];assert.equal(m.code,'1603');assert.ok(!codeForms(m).includes('0x80070643'));
 assert.equal(find(prepared,{query:'0x80070643',product:'Windows Installer 반환 코드'}).records[0].code,'1603');
 assert.equal(find(prepared,{query:'<img src=x onerror=alert(1)>'}).total,0);
});
test('pagination, filters and empty result remain deterministic',()=>{
 assert.equal(find(prepared,{page:2}).records[0].id,rows[40].id);assert.equal(find(prepared,{page:99999}).page,Math.ceil(rows.length/40));
 assert.ok(find(prepared,{vendor:'Cloudflare'}).records.every(r=>r.vendor==='Cloudflare'));
 assert.equal(find(prepared,{query:'definitely-not-a-real-code-zzzz'}).total,0);
 assert.equal(find(prepared,{query:'ＥＲＲ＿ＩＮＶＡＬＩＤ＿ＡＲＧ＿ＴＹＰＥ'}).records[0].code,'ERR_INVALID_ARG_TYPE');
});
test('publisher guard, all integrations and sanitized GA location',()=>{
 const script=HEAD.match(/<script>([\s\S]+)<\/script>/)[1];
 const run=(hostname,existing=false)=>{const scripts=[],events=[];const ctx={location:{hostname,origin:'https://'+hostname,pathname:'/error-code-directory/',search:'?private=secret',hash:'#secret'},Date,JSON,document:{referrer:'https://example.com/page?password=secret#x',readyState:'complete',createElement:()=>({setAttribute(k,v){this[k]=v;}}),querySelector:()=>existing?{}:null,head:{appendChild:s=>scripts.push(s)}}};ctx.window=ctx;vm.runInNewContext(script,ctx);return{scripts,events:ctx.dataLayer||[]};};
 for(const host of ['localhost','127.0.0.1','preview.local','[::1]'])assert.equal(run(host).scripts.length,0);
 const live=run('nanalab.kr');assert.equal(live.scripts.length,4);for(const id of Object.values(IDS))assert.ok(JSON.stringify(live).includes(id));
 const event=live.events.find(e=>e[0]==='config');assert.equal(event[2].page_location,'https://nanalab.kr/error-code-directory/');assert.equal(event[2].page_referrer,'https://example.com/page');
 assert.equal(run('nanalab.kr',true).scripts.length,3);
});
test('every output page has integrations, attribution and valid route graph',()=>{
 const root=new URL('../docs/',import.meta.url),manifest=JSON.parse(fs.readFileSync(new URL('build-manifest.json',root),'utf8'));
 const files=new Set(Object.keys(manifest.files)),html=[...files].filter(n=>n.endsWith('.html'));
 assert.equal(html.filter(n=>n.startsWith('codes/')).length,rows.length);
 let links=0;
 for(const n of html){const text=fs.readFileSync(new URL(n,root),'utf8');
   for(const id of Object.values(IDS))assert.ok(text.includes(id),n+' '+id);
   assert.ok(text.includes('<noscript><iframe src="https://www.googletagmanager.com/ns.html?'));assert.ok(text.includes('src_cdn/banner/astra.js'));
   assert.equal((text.match(/rel="canonical"/g)||[]).length,1);
   for(const match of text.matchAll(/(?:href|src)="(\/error-code-directory\/[^"#]*)(?:#[^"]*)?"/g)){
     let target=match[1].slice('/error-code-directory/'.length);if(!target||target.endsWith('/'))target+='index.html';assert.ok(files.has(target),`${n} -> ${target}`);links++;
   }
 }
 for(const r of rows){const text=fs.readFileSync(new URL('codes/'+r.id+'/index.html',root),'utf8');assert.ok(text.includes('출처·이용 조건'));assert.ok(text.includes('공식 설명 · 원문'));assert.ok(text.includes('해결·진단 링크'));assert.ok(r.solution_links.length>0);}
 const sitemap=fs.readFileSync(new URL('sitemap.xml',root),'utf8');assert.equal((sitemap.match(/<loc>/g)||[]).length,html.length-1);assert.ok(!sitemap.includes('404.html'));
 console.log(`${html.length} HTML, ${links} internal links checked`);
});
test('source relationships and honest link classifications',()=>{
 const sources=JSON.parse(fs.readFileSync(new URL('../data/sources.json',import.meta.url),'utf8')),map=new Map(sources.map(s=>[s.id,s]));
 assert.equal(new Set(rows.map(r=>r.product+'\0'+r.code)).size,rows.length);
 for(const r of rows){const s=map.get(r.source_id);assert.ok(s&&s.license_id===r.license_id);assert.ok(r.message.trim());assert.ok(['error','status'].includes(r.status_kind));
  for(const l of r.solution_links){assert.equal(new URL(l.url).protocol,'https:');assert.ok(['troubleshooting','diagnostic-guide','reference'].includes(l.kind));assert.ok(['code-specific','product-guide','code-reference'].includes(l.scope));}
 }
 assert.ok(!JSON.stringify(sources).includes('cache_path'));assert.ok(!JSON.stringify(sources).includes('C:\\Users'));
});
