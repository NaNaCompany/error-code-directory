import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {HEAD,NOSCRIPT,BOOK} from '../src/publisher.mjs';
import {codeForms} from '../src/search.mjs';
import {LOCALES,LANGUAGES,translate,localizeMarkup,localePath,runtimeUI} from '../src/i18n.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=n=>fs.readFileSync(path.join(root,n),'utf8');
const json=n=>JSON.parse(read(n));
const records=json('data/catalog.json'),sources=json('data/sources.json'),notices=json('data/notices.json');
const translationNoticeFiles=fs.readdirSync(path.join(root,'data/translation-notices')).sort();
const sourceMap=new Map(sources.map(s=>[s.id,s]));
const rootBase='/error-code-directory/',origin='https://nanalab.kr',home=origin+rootBase;
let lang='ko',base=rootBase,light=[],lightMap=new Map(),index='';
const tr=(text,values={})=>translate(text,lang,values);
const translationData=Object.fromEntries(LANGUAGES.filter(l=>l!=='en').map(l=>{const data=json('data/i18n/'+l+'.json');if(data.source_catalog_sha256!==crypto.createHash('sha256').update(read('data/catalog.json')).digest('hex'))throw Error('Stale translation '+l);if(records.some(r=>!data.messages[r.id]))throw Error('Missing translated description '+l);return[l,data];}));
const message=r=>lang==='en'?r.message:translationData[lang].messages[r.id];
const translationProvider=r=>translationData[lang]?.message_providers?.[r.id]??translationData[lang]?.provider??'';
const productName=r=>tr(r.product);
const context=r=>lang==='ko'?r.situation:tr('코드 {code} · {product}에서 보고한 문제입니다.',{code:r.code,product:productName(r)});
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const jscript=v=>JSON.stringify(v).replace(/</g,'\\u003c');
const fmt=n=>n.toLocaleString(LOCALES[lang].locale);
const vendors=[...new Set(records.map(r=>r.vendor))].sort();
const slug=v=>v.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const vendorURL=v=>base+'vendors/'+slug(v)+'/';
const codeURL=r=>base+'codes/'+r.id+'/';
const products=[...new Map(records.map(r=>[r.vendor+'\0'+r.product,{vendor:r.vendor,product:r.product}])).values()];
const files=new Map(),urls=[];
const put=(name,content)=>{if(files.has(name))throw Error('Duplicate output '+name);files.set(name,Buffer.isBuffer(content)?content:Buffer.from(content));};
const asset=(name,content)=>{const ext=path.extname(name),stem=name.slice(0,-ext.length),file=`assets/${stem}.${hash(content).slice(0,12)}${ext}`;put(file,content);return rootBase+file;};
const css=asset('style.css',read('src/style.css'));
const search=asset('search.mjs',read('src/search.mjs'));
const app=asset('app.mjs',read('src/app.mjs').replace("'./search.mjs'",JSON.stringify('./'+path.basename(search))));
put('assets/icon.svg',read('src/icon.svg'));
if(fs.existsSync(path.join(root,'src/og.png')))put('assets/og.png',fs.readFileSync(path.join(root,'src/og.png')));
function page(route,title,description,body,{config={},noindex=false,structured=null}={}){
 const canonical=origin+base+route,assetBase=rootBase+'assets/';
 const alternates=LANGUAGES.map(l=>`<link rel="alternate" hreflang="${l}" href="${origin+localePath(l,route)}">`).join('')+`<link rel="alternate" hreflang="x-default" href="${origin+localePath('ko',route)}">`;
 const switcher=`<nav class="language-switcher" aria-label="${esc(tr('언어'))}">${LANGUAGES.map(l=>`<a lang="${l}" hreflang="${l}" href="${localePath(l,route)}"${l===lang?' aria-current="page"':''}>${LOCALES[l].name}</a>`).join('')}</nav>`;
 const runtime={...config,lang,locale:LOCALES[lang].locale,ui:config.initial?runtimeUI(lang):Object.fromEntries(['복사했습니다.','자동 복사를 사용할 수 없습니다. 코드나 주소를 선택해 복사하세요.'].map(k=>[k,tr(k)])),...(config.initial?{productLabels:Object.fromEntries(products.map(p=>[p.product,tr(p.product)]))}:{})};
 const html=`<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(tr(title))} · ${esc(tr('에러 코드 포털'))}</title><meta name="description" content="${esc(tr(description))}"><link rel="canonical" href="${canonical}">${alternates}${noindex?'<meta name="robots" content="noindex,follow">':''}<meta property="og:type" content="website"><meta property="og:locale" content="${LOCALES[lang].og}"><meta property="og:title" content="${esc(tr(title))}"><meta property="og:description" content="${esc(tr(description))}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${home}assets/og.png"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="${assetBase}icon.svg" type="image/svg+xml"><link rel="stylesheet" href="${css}">${structured?`<script type="application/ld+json">${jscript(structured)}</script>`:''}${HEAD}</head><body>${NOSCRIPT}<a class="skip" href="#main">${tr('본문으로 건너뛰기')}</a><header class="top wrap"><a class="brand" href="${base}"><img src="${assetBase}icon.svg" width="34" height="34" alt="">${tr('에러 코드 포털')}</a><nav aria-label="${tr('주 메뉴')}"><a href="${base}">${tr('코드 검색')}</a><a href="${base}vendors/">${tr('업체별 목록')}</a><a href="${base}sources/">${tr('출처')}</a></nav></header><main id="main" class="wrap">${localizeMarkup(body,lang)}</main><footer class="wrap"><div class="footer-inner"><div><a href="${base}sources/">${tr('출처·수집 범위')}</a> · <a href="${base}licenses/">${tr('라이선스')}</a> · <a href="${base}privacy/">${tr('개인정보')}</a> · <a href="${rootBase}sitemap-${lang}.xml">${tr('사이트맵')}</a><p class="footer-note">${tr('공식 문서 기반 코드 참고 자료. 환경·제품 버전에 따라 의미와 조치가 달라질 수 있습니다.')}</p></div><a class="more-apps" href="https://nanalab.kr/apps/">More Apps</a></div>${switcher}</footer><p id="status" class="wrap hint" role="status" aria-live="polite"></p><script type="application/json" id="page-config">${jscript(runtime)}</script><script type="module" src="${app}"></script>${BOOK}</body></html>`;
 const relative=(lang==='ko'?'':lang+'/')+route;
 const file=route.endsWith('.html')?relative:relative+'index.html';put(file,html);if(!noindex)urls.push({lang,url:canonical});
}
const row=r=>`<li class="result-row"><div class="code-cell"><a class="code-link" href="${codeURL(r)}">${esc(r.code)}</a>${r.aliases?.length?`<span class="alias">${esc(r.aliases.slice(0,2).join(' · '))}</span>`:''}</div><div class="summary-cell"><a class="result-title" href="${codeURL(r)}">${esc(r.title)}</a><p class="result-summary">${esc(lang==='ko'?r.situation:message(r))}</p></div><div class="scope-cell"><span class="vendor-tag">${esc(r.vendor)}</span><span class="product-label">${esc(r.product)}</span></div></li>`;
function listing(rows,vendor='',n=1){
 const size=40,pages=Math.ceil(rows.length/size),part=rows.slice((n-1)*size,n*size);
 const route=vendor?'vendors/'+slug(vendor)+'/'+(n>1?`page/${n}/`:''):(n>1?`page/${n}/`:'');
 const pagePath=p=>vendor?vendorURL(vendor)+(p>1?`page/${p}/`:''):base+(p>1?`page/${p}/`:'');
 const title=vendor?`${vendor} 에러 코드${n>1?' · '+n+'페이지':''}`:`에러 코드 검색${n>1?' · '+n+'페이지':''}`;
 const body=`<section class="overview"><h1>${esc(vendor?vendor+' 에러 코드':'에러 코드 검색')}</h1><p>코드·오류 메시지로 검색하고 공식 설명과 해결·진단 링크를 확인하세요.</p><div class="detail-meta"><span>${esc(tr('{count}개 코드',{count:fmt(records.length)}))}</span><span class="dot">·</span><span>${esc(tr('{count}개 제품',{count:fmt(products.length)}))}</span><span class="dot">·</span><span>${esc(tr('공식 문서 {count}건',{count:fmt(sources.length)}))}</span></div></section><section class="search-panel" aria-label="코드 검색"><label class="query-label" for="query">에러 코드 또는 메시지</label><div class="search-box"><span class="search-icon" aria-hidden="true">⌕</span><input id="query" type="search" autocomplete="off" spellcheck="false" placeholder="예: 0x80070005, AADSTS50076, SQLITE_BUSY" aria-describedby="search-hint"></div><div class="filters"><label>업체<select id="vendor"><option value="">전체 업체</option>${vendors.map(v=>`<option${v===vendor?' selected':''}>${esc(v)}</option>`).join('')}</select></label><label>제품<select id="product"><option value="">전체 제품</option>${products.filter(p=>!vendor||p.vendor===vendor).map(p=>`<option value="${esc(p.product)}">${esc(productName(p))}</option>`).join('')}</select></label><button id="clear" class="button" type="button"${vendor?'':' hidden'}>필터 지우기</button></div><p class="hint" id="search-hint">검색은 브라우저 안에서 처리합니다. 같은 번호도 제품에 따라 의미가 다릅니다.</p><noscript><p>전체 검색에는 JavaScript가 필요합니다. 아래 페이지와 업체별 목록은 그대로 이용할 수 있습니다.</p></noscript></section><section id="results"><div class="results-head"><h2>${vendor?esc(vendor)+' 코드':'코드 목록'}</h2><span id="result-count">${esc(tr('{count}개',{count:fmt(rows.length)}))}</span></div><div class="results-table"><div class="table-heading"><span>코드</span><span>문제·상황</span><span>업체·제품</span></div><ul id="result-list">${part.map(row).join('')}</ul></div><nav id="result-pager" class="pagination" aria-label="코드 목록 페이지">${n>1?`<a class="button" href="${pagePath(n-1)}">← 이전</a>`:'<span></span>'}<span>${n} / ${pages}</span>${n<pages?`<a class="button" href="${pagePath(n+1)}">다음 →</a>`:'<span></span>'}</nav></section><section class="vendor-section"><h2>업체별 코드</h2><div class="vendors">${vendors.map(v=>`<a class="vendor-card" href="${vendorURL(v)}"><strong>${esc(v)}</strong><span>${esc(tr('{count}개 코드 →',{count:fmt(records.filter(r=>r.vendor===v).length)}))}</span></a>`).join('')}</div></section>`;
 page(route,title,tr('{product} 오류 코드의 공식 설명과 해결·진단 문서.',{product:vendor||tr('Windows, Node.js, 데이터베이스와 클라우드')}),body,{config:{base,index,initial:part.map(r=>lightMap.get(r.id)),vendor,products,page:n}});
}
const linkKind={troubleshooting:'해결 절차','diagnostic-guide':'일반 진단 가이드',reference:'코드 참고'};
const linkScope={'code-specific':'해당 코드 · 적용 환경 확인','product-guide':'제품 전반 · 해당 코드 전용 아님','code-reference':'정의·설명 · 해결 절차 아님'};
const checked=[...new Set(sources.map(s=>s.checked_at.slice(0,10)))].sort();
for(const locale of LANGUAGES){
 lang=locale;base=localePath(lang);
 light=records.map(r=>({id:r.id,vendor:r.vendor,product:r.product,code:r.code,aliases:codeForms(r),title:tr(r.title),message:message(r).slice(0,1800),original_message:r.message.slice(0,1800),situation:lang==='ko'?r.situation:message(r).slice(0,240),status_kind:r.status_kind}));
 lightMap=new Map(light.map(r=>[r.id,r]));
 index=asset('search-index-'+lang+'.json',JSON.stringify({version:1,language:lang,records:light}));
 for(let n=1;n<=Math.ceil(records.length/40);n++)listing(records,'',n);
for(const v of vendors){const rows=records.filter(r=>r.vendor===v);for(let n=1;n<=Math.ceil(rows.length/40);n++)listing(rows,v,n);}
page('vendors/','업체별 코드 목록','업체·제품별 공식 에러 코드 목록',`<section class="overview"><h1>업체별 코드 목록</h1><p>제품을 구분해 코드를 찾으세요.</p></section><div class="vendors">${vendors.map(v=>`<a class="vendor-card" href="${vendorURL(v)}"><strong>${esc(v)}</strong><span>${esc(tr('{count}개 코드 →',{count:fmt(records.filter(r=>r.vendor===v).length)}))}</span><small>${esc([...new Set(records.filter(r=>r.vendor===v).map(r=>r.product))].join(' · '))}</small></a>`).join('')}</div>`);
for(const r of records){
 const s=sourceMap.get(r.source_id);if(!s)throw Error('Missing source '+r.id);
 const related=records.filter(x=>x.product===r.product&&x.id!==r.id);const pos=related.findIndex(x=>x.code>r.code);const around=related.slice(Math.max(0,pos),Math.max(0,pos)+5);if(!around.length)around.push(...related.slice(0,5));
 const forms=codeForms(r).filter(c=>c!==r.code);
 const status=r.status_kind==='status';
 const diagnostic=r.solution_links.some(l=>l.kind!=='reference');
 const legacy=/legacy/i.test(s.id+' '+s.title)||r.legacy||r.deprecated||r.lifecycle==='legacy'||r.lifecycle==='deprecated';
 const body=`<nav class="breadcrumb" aria-label="현재 위치"><a href="${base}">코드 검색</a><span> / </span><a href="${vendorURL(r.vendor)}">${esc(r.vendor)}</a><span> / ${esc(r.product)}</span></nav><div class="detail-grid"><article class="panel"><div class="detail-meta"><span class="vendor-tag">${esc(r.vendor)}</span><span>${esc(r.product)}</span><span class="badge">${status?'경고·상태 코드':'오류 코드'}</span>${legacy?'<span class="badge">레거시 · 지원 버전 확인</span>':''}</div><h1 class="code-display">${esc(r.code)}</h1><h2 class="detail-title">${esc(r.title)}</h2>${forms.length?`<p class="alias">다른 표기: ${esc(forms.join(' · '))}</p>`:''}<div class="code-actions"><button class="button" type="button" data-copy-code="${esc(r.code)}">코드 복사</button><button class="button" type="button" data-copy-link>링크 복사</button></div><section><h2 class="section-label">어떤 문제인가요?</h2><p class="situation">${esc(context(r))}</p>${status?'<p class="notice">이 항목은 오류가 아닌 경고·상태를 포함합니다. 원문에서 반환 조건을 확인하세요.</p>':''}${lang==='en'?'':`<h3 class="section-label">${tr('번역 설명')}</h3><div class="message translated-message" lang="${lang}">${esc(message(r))}</div><p class="hint">${esc(translationProvider(r))} · ${tr('자동 번역입니다. 기술 용어와 적용 조건은 영문 원문을 확인하세요.')}</p>`}<h3 class="section-label">공식 설명 · 원문</h3><div class="message" lang="en">${esc(r.message)}</div></section><section><h2>해결·진단 링크</h2><p class="hint">문서의 제품·버전·발생 환경이 현재 상황과 일치하는지 먼저 확인하세요.</p><ul class="solution-list">${r.solution_links.map(l=>`<li><span class="badge">${linkKind[l.kind]||'공식 문서'}</span><h3><a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(tr(l.label))} ↗</a></h3><p>${esc(linkScope[l.scope]||'원문 적용 범위 확인')}</p></li>`).join('')}</ul>${!diagnostic?'<p class="notice">이 항목은 공식 코드 참고 문서만 연결되어 있습니다. 별도의 해결 절차를 검증하지 않았습니다.</p>':''}</section><section class="metadata"><h2>출처·이용 조건</h2><p><a href="${esc(r.reference_url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)} ↗</a></p><p>저작자: ${esc(s.creator)}<br>라이선스: <a href="${esc(s.license_url)}" target="_blank" rel="noopener noreferrer">${esc(s.license_name)}</a><br>확인일: ${esc(s.checked_at.slice(0,10))}</p><p>변경 내역: ${esc(s.modifications)} ${lang==='en'?'':esc(tr('번역 설명에는 자동 번역 표시를 추가했습니다.'))}</p><p><a href="${base}sources/#${esc(s.id)}">출처 상세</a> · <a href="${base}licenses/">라이선스 원문·고지</a></p></section></article><aside><section class="panel related"><h2>같은 제품의 코드</h2><ul>${around.map(x=>`<li><a href="${codeURL(x)}"><code>${esc(x.code)}</code><span>${esc(x.title)}</span></a></li>`).join('')}</ul><a href="${vendorURL(r.vendor)}">${esc(tr('{vendor} 전체 코드 →',{vendor:r.vendor}))}</a></section><section class="panel"><h2>번호가 같은데 뜻이 다른가요?</h2><p>코드는 제품별로 정의됩니다. 특히 Windows Installer 반환 코드와 설치 메시지 번호는 서로 다른 목록입니다.</p><a href="${base}">다른 제품에서 검색 →</a></section></aside></div>`;
 const description=`${productName(r)} ${r.code}: ${message(r).replace(/\s+/g,' ').slice(0,145)}`;
 page('codes/'+r.id+'/',`${r.code} · ${r.product}`,description,body,{structured:{'@context':'https://schema.org','@type':'TechArticle',headline:`${productName(r)} ${r.code}`,description,url:origin+codeURL(r),inLanguage:lang,citation:r.reference_url,license:s.license_url}});
}
page('sources/','출처·수집 범위','공식 문서 출처, 수집 범위, 코드 분류와 재이용 조건',`<section class="overview"><h1>출처·수집 범위</h1><p>${fmt(records.length)}개 코드 · ${products.length}개 제품 · 확인일 ${esc(checked.join(' ~ '))}</p></section><article class="panel prose"><h2>포함한 목록</h2><ul>${products.map(p=>`<li>${esc(p.product)} — ${fmt(records.filter(r=>r.product===p.product).length)}개 코드</li>`).join('')}</ul><h2>자료 해석</h2><p>공식 문서에서 코드·이름·설명을 추출하고 한국어 제품 문맥과 링크 분류를 추가했습니다. 원문 설명은 영어로 유지했습니다. 모든 제품·버전의 모든 코드를 포함한다고 보장하지 않습니다. 원문 업데이트가 이 사본보다 빠를 수 있습니다.</p><p>번역 설명에는 자동 번역 표시를 추가했습니다.</p><p>성공·경고·오류가 섞인 공식 목록에서 상태 코드는 별도로 표시합니다. 레거시 코드도 원문 지원 상태를 확인해야 합니다.</p><p>“해결 절차”는 코드별 공식 문제 해결 문서, “일반 진단 가이드”는 제품 공통 문서, “코드 참고”는 정의 문서입니다. 참고 문서를 해결책으로 간주하지 않습니다. 관리자의 승인 없이 보안 설정을 끄거나 데이터를 삭제하지 마세요.</p><h2>Windows 코드 표기</h2><p>Win32 및 Windows Installer 반환 코드는 검색 편의를 위해 16진수와 FACILITY_WIN32 HRESULT 표기를 추가했습니다. 설치 메시지 번호는 변환하지 않습니다. 공식 <a href="https://learn.microsoft.com/en-us/windows/win32/api/winerror/nf-winerror-hresult_from_win32">HRESULT_FROM_WIN32 문서</a>의 매핑을 사용합니다. 같은 번호라도 API와 제품이 일치해야 합니다.</p><h2>조회용 JSON</h2><p><a href="${rootBase}api/errors.json">코드 목록</a> · <a href="${rootBase}api/sources.json">출처 목록</a> · <a href="${rootBase}api/index.json">스키마·범위</a></p><h2>공식 출처 ${sources.length}건</h2><div class="sources-list">${sources.map(s=>`<section class="source-card" id="${esc(s.id)}"><h3><a href="${esc(s.url)}">${esc(s.title)} ↗</a></h3><p>${esc(s.creator)} · ${esc(s.checked_at.slice(0,10))}<br><a href="${esc(s.license_url)}">${esc(s.license_name)}</a> · <a href="${esc(s.source_url)}">수집한 원문</a></p><p>변경: ${esc(s.modifications)} ${lang==='en'?'':esc(tr('번역 설명에는 자동 번역 표시를 추가했습니다.'))}</p><p class="alias">원문 SHA-256: ${esc(s.sha256)}</p></section>`).join('')}</div></article>`);

page('licenses/','라이선스·고지','출처별 저작권, 라이선스와 재배포 고지',`<section class="overview"><h1>라이선스·고지</h1></section><article class="panel prose"><p>설명 원문의 권리는 각 저작자에게 있습니다. 제품명·상표는 해당 소유자의 소유입니다. 이 포털은 업체의 공식 서비스가 아닙니다.</p><p>재이용한 설명에는 각 코드 페이지와 출처 목록에 원문·저작자·라이선스·변경 내역을 표시합니다. 복사된 라이선스 고지와 법적 안내는 아래에 보존했습니다. 문서와 코드 예제의 라이선스가 다른 경우 설명 문서에 적용되는 조건을 사용했습니다. 코드 예제는 재배포하지 않습니다.</p><ul>${notices.map(n=>`<li><a href="${rootBase}licenses/notices/${esc(n.file)}">${esc(n.file)}</a></li>`).join('')}</ul><p>Cloudflare 문서는 현재 공식 저장소의 CC BY 4.0 조건을 확인했습니다. Microsoft Entra는 문서 Legal Notices의 CC BY 4.0을 적용하며, 저장소 MIT LICENSE와 README를 함께 보존했습니다. Node.js는 문서 포함 MIT 고지를, Python 설명은 PSF License 2를, PostgreSQL은 PostgreSQL License를, SQLite는 문서의 public-domain 고지를 따릅니다. Google RPC 정의는 Apache-2.0입니다.</p><p><a href="${base}sources/">출처별 조건·변경 내역 보기 →</a></p><h2>번역 도구·모델</h2><ul>${translationNoticeFiles.map(name=>`<li><a href="${rootBase}licenses/translations/${esc(name)}">${esc(name)}</a></li>`).join('')}</ul></article>`);
page('privacy/','개인정보·검색 처리','브라우저 내 코드 검색과 외부 분석·광고 서비스 안내',`<section class="overview"><h1>개인정보·검색 처리</h1></section><article class="panel prose"><h2>코드 검색</h2><p>코드 목록을 내려받은 뒤 검색·필터는 브라우저에서 처리합니다. 검색어를 서버에 제출하거나 URL에 기록하지 않습니다. 파일 업로드·계정·비밀번호 입력 기능은 없습니다.</p><h2>접속 통계·광고</h2><p>공개 배포 페이지는 Google Analytics 4, Google Tag Manager, Google AdSense, Cloudflare Web Analytics를 사용합니다. 서비스는 접속·기기 정보와 쿠키 등을 각 정책에 따라 처리할 수 있습니다. 이 앱은 검색어와 입력값을 이들 서비스에 전송하는 이벤트를 만들지 않습니다. GA4의 페이지 주소는 쿼리와 해시를 제외합니다. 로컬 개발 서버는 분석·광고 스크립트를 제거하고 외부 요청을 차단합니다.</p><p><a href="https://policies.google.com/privacy">Google 개인정보처리방침</a> · <a href="https://www.cloudflare.com/privacypolicy/">Cloudflare 개인정보처리방침</a></p><h2>외부 링크</h2><p>공식 해결 문서는 외부 사이트로 이동합니다. 공유 도서 배너는 외부 서점으로 연결되며, 검색어를 배너에 전달하지 않습니다.</p></article>`);
page('404.html','페이지를 찾을 수 없습니다','주소를 확인하거나 코드 검색을 이용하세요.',`<section class="panel prose"><h1>페이지를 찾을 수 없습니다</h1><p>주소가 변경되었거나 없는 코드입니다.</p><a class="button primary" href="${base}">코드 검색으로 이동</a></section>`,{noindex:true});
}
lang='ko';base=rootBase;
for(const n of notices)put('licenses/notices/'+n.file,fs.readFileSync(path.join(root,'data/notices',n.file)));
for(const name of translationNoticeFiles)put('licenses/translations/'+name,fs.readFileSync(path.join(root,'data/translation-notices',name)));
for(const locale of LANGUAGES.filter(l=>l!=='en'))put('api/translations/'+locale+'.json',JSON.stringify(json('data/i18n/'+locale+'.json'),null,2)+'\n');
put('api/errors.json',JSON.stringify(records,null,2)+'\n');put('api/sources.json',JSON.stringify(sources,null,2)+'\n');put('api/index.json',JSON.stringify({version:2,title:'에러 코드 포털',home_page_url:home,language:'ko',languages:LANGUAGES,language_paths:Object.fromEntries(LANGUAGES.map(l=>[l,l==='ko'?'':l+'/'])),translations:Object.fromEntries(LANGUAGES.filter(l=>l!=='en').map(l=>[l,home+'api/translations/'+l+'.json'])),translation_note:'Machine translations of official English descriptions; original text, sources and licenses retained in errors.json and sources.json.',count:records.length,products:products.map(p=>({...p,count:records.filter(r=>r.product===p.product).length})),errors_url:home+'api/errors.json',sources_url:home+'api/sources.json',record_key:['product','code'],link_kinds:linkKind,link_scopes:linkScope,checked_dates:checked},null,2)+'\n');
const sitemapNames=LANGUAGES.map(l=>'sitemap-'+l+'.xml');
for(const locale of LANGUAGES){const locations=urls.filter(row=>row.lang===locale).map(row=>row.url);put('sitemap-'+locale+'.xml','<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+locations.map(url=>`  <url><loc>${esc(url)}</loc></url>`).join('\n')+'\n</urlset>\n');}
put('sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+sitemapNames.map(name=>`  <sitemap><loc>${home+name}</loc></sitemap>`).join('\n')+'\n</sitemapindex>\n');
put('robots.txt',`User-agent: *\nAllow: /\n\nSitemap: ${home}sitemap.xml\n${sitemapNames.map(n=>'Sitemap: '+home+n).join('\n')}\n`);put('ads.txt','google.com, pub-9767176956440077, DIRECT, f08c47fec0942fa0\n');put('.nojekyll','');
const totalBytes=[...files.values()].reduce((n,b)=>n+b.length,0);
if(totalBytes>900*1024*1024)throw Error('Pages artifact exceeds conservative 900 MiB threshold: '+totalBytes);
const manifest={version:2,records:records.length,languages:LANGUAGES,total_bytes:totalBytes,html_pages:[...files.keys()].filter(n=>n.endsWith('.html')).length,sitemap_urls:urls.length,files:Object.fromEntries([...files].map(([n,b])=>[n,hash(b)]))};
put('build-manifest.json',JSON.stringify(manifest,null,2)+'\n');
const dest=path.join(root,'docs');
if(process.argv.includes('--check')){
 const python=process.env.PYTHON_EXECUTABLE||(process.platform==='win32'?'python':'python3');
 const checked=spawnSync(python,['-B','-X','utf8',path.join(root,'tools/verify_generated.py'),dest],{input:JSON.stringify(Object.fromEntries([...files].map(([n,b])=>[n,hash(b)]))),encoding:'utf8',maxBuffer:1024*1024});
 if(checked.error)throw checked.error;
 if(checked.stdout)console.log(checked.stdout.trim());
 if(checked.status!==0)throw Error('Generated output verification failed: '+checked.stderr);
}else{
 const prev=fs.existsSync(path.join(dest,'build-manifest.json'))?JSON.parse(fs.readFileSync(path.join(dest,'build-manifest.json'),'utf8')):{files:{}};
 for(const n of Object.keys(prev.files)){const p=path.resolve(dest,n);if(!p.startsWith(dest+path.sep))throw Error('Unsafe old output');if(!files.has(n)&&fs.existsSync(p))fs.unlinkSync(p);}
 let written=0,unchanged=0;
 for(const [n,b]of files){
  const p=path.resolve(dest,n);if(!p.startsWith(dest+path.sep))throw Error('Unsafe output');
  // Normal builds reuse the last complete manifest; --check always reads every file.
  // --force restores output after direct generated-file edits or deletions.
  if(n!=='build-manifest.json'&&!process.argv.includes('--force')&&prev.files[n]===manifest.files[n]){unchanged++;continue;}
  fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,b);written++;
 }
 console.log(JSON.stringify({written,unchanged}));
}
console.log(JSON.stringify({mode:process.argv.includes('--check')?'check':'build',...Object.fromEntries(Object.entries(manifest).filter(([k])=>k!=='files')),files:files.size}));
