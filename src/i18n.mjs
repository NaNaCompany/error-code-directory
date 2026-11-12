import fs from 'node:fs';
export const LOCALES={ko:{name:'한국어',locale:'ko-KR',og:'ko_KR'},en:{name:'English',locale:'en-US',og:'en_US'},ja:{name:'日本語',locale:'ja-JP',og:'ja_JP'},zh:{name:'中文',locale:'zh-CN',og:'zh_CN'},es:{name:'Español',locale:'es-ES',og:'es_ES'},de:{name:'Deutsch',locale:'de-DE',og:'de_DE'},fr:{name:'Français',locale:'fr-FR',og:'fr_FR'},pt:{name:'Português',locale:'pt-BR',og:'pt_BR'},ru:{name:'Русский',locale:'ru-RU',og:'ru_RU'}};
export const LANGUAGES=Object.keys(LOCALES);
export const UI=JSON.parse(fs.readFileSync(new URL('./ui-translations.json',import.meta.url),'utf8'));
const escapePattern=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const patterns=Object.fromEntries(LANGUAGES.filter(l=>l!=='ko').map(l=>[l,new RegExp(Object.keys(UI[l]||{}).filter(Boolean).sort((a,b)=>b.length-a.length).map(escapePattern).join('|'),'g')]));
export function translate(text,lang='ko',values={}){
 let result=lang==='ko'?String(text):(UI[lang]?.[text]??String(text).replace(patterns[lang],key=>UI[lang][key]));
 for(const [key,value] of Object.entries(values))result=result.replaceAll('{'+key+'}',String(value));
 return result;
}
export function localizeMarkup(html,lang){
 if(lang==='ko')return html;
 return html.replace(/<div class="message" lang="en">[\s\S]*?<\/div>|<[^>]*>|[^<]+/g,part=>{
  if(part.startsWith('<div class="message" lang="en">'))return part;
  if(part.startsWith('<'))return part.replace(/(aria-label|placeholder)="([^"]*)"/g,(_,attr,text)=>`${attr}="${translate(text,lang)}"`);
  return translate(part,lang);
 });
}
export const localePath=(lang,route='')=>'/error-code-directory/'+(lang==='ko'?'':lang+'/')+route;
export const RUNTIME_KEYS=['복사했습니다.','자동 복사를 사용할 수 없습니다. 코드나 주소를 선택해 복사하세요.','전체 제품','일치하는 코드를 찾지 못했습니다.','업체·제품 필터를 지우거나 오류 메시지의 코드 부분만 입력하세요.','현재 목록 ','{count}개','← 이전','다음 →','전체 검색 목록을 불러오지 못했습니다. 업체별 목록에서 계속 탐색할 수 있습니다.','전체 검색 목록을 불러오지 못했습니다. 업체별 목록과 페이지 링크를 이용하세요.','전체 코드 목록을 불러오는 중입니다.'];
export const runtimeUI=lang=>Object.fromEntries(RUNTIME_KEYS.map(key=>[key,translate(key,lang)]));
