import {fullPageAudit} from './page-audit.mjs';
import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';
import {LANGUAGES,LOCALES,UI,translate,localePath} from '../src/i18n.mjs';
const raw=fs.readFileSync(new URL('../data/catalog.json',import.meta.url)),records=JSON.parse(raw),escape=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
test('complete descriptions, original provenance and UI dictionaries for nine languages',()=>{
 const source=crypto.createHash('sha256').update(raw).digest('hex');const expected=Object.keys(UI.en).sort();
 for(const lang of LANGUAGES){if(lang==='ko')continue;assert.deepEqual(Object.keys(UI[lang]).sort(),expected);assert.ok(!/[가-힣]/.test(translate('자동 번역입니다. 기술 용어와 적용 조건은 영문 원문을 확인하세요.',lang)));}
 for(const lang of LANGUAGES.filter(l=>l!=='en')){const data=JSON.parse(fs.readFileSync(new URL('../data/i18n/'+lang+'.json',import.meta.url),'utf8'));assert.equal(data.source_catalog_sha256,source);assert.equal(data.machine_translated,true);assert.equal(Object.keys(data.messages).length,records.length);for(const r of records)assert.ok(data.messages[r.id]?.trim());}
 for(const label of new Set(records.flatMap(r=>r.solution_links.map(l=>l.label))))for(const lang of LANGUAGES.filter(l=>l!=='ko'))assert.ok(UI[lang][label],lang+' missing diagnostic label '+label);
});
test('same-code switcher, canonical, hreflang and original message stay consistent across every detail route',()=>{const audit=fullPageAudit();assert.equal(audit.status,'passed');assert.equal(audit.detail_pages,records.length*9);assert.deepEqual(audit.languages,LANGUAGES);});
