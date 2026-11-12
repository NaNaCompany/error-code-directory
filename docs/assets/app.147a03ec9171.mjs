import {prepare,find} from "./search.12b835a2dc2f.mjs";
const $=id=>document.getElementById(id),configNode=$('page-config');
const config=configNode?JSON.parse(configNode.textContent):{};
const tr=(text,values={})=>{let result=config.ui?.[text]??text;for(const [key,value] of Object.entries(values))result=result.replaceAll('{'+key+'}',String(value));return result;};
const status=$('status');
document.querySelectorAll('[data-copy-code],[data-copy-link]').forEach(button=>button.addEventListener('click',async()=>{
  const text=button.hasAttribute('data-copy-link')?location.origin+location.pathname:button.dataset.copyCode;
  try {await navigator.clipboard.writeText(text);if(status)status.textContent=tr('복사했습니다.');}
  catch (_) {if(status)status.textContent=tr('자동 복사를 사용할 수 없습니다. 코드나 주소를 선택해 복사하세요.');}
}));
if ($('query')) {
  const query=$('query'),vendor=$('vendor'),product=$('product'),list=$('result-list'),count=$('result-count'),pager=$('result-pager');
  let records=prepare(config.initial||[]),loaded=false,failed=false,page=config.page||1,timer;
  function updateProducts() {
    const selected=product.value;
    const values=[...new Set((config.products||[]).filter(p=>!vendor.value||p.vendor===vendor.value).map(p=>p.product))].sort();
    product.replaceChildren(new Option(tr('전체 제품'),''),...values.map(name=>new Option(config.productLabels?.[name]??name,name)));
    product.value=values.includes(selected)?selected:'';
  }
  function node(tag,text,className) {const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(className)n.className=className;return n;}
  function render() {
    if(!loaded&&!query.value&&!product.value&&vendor.value===(config.vendor||'')){
      if(status)status.textContent=failed?tr('전체 검색 목록을 불러오지 못했습니다. 업체별 목록과 페이지 링크를 이용하세요.'):'';
      return;
    }
    const result=find(records,{query:query.value,vendor:vendor.value,product:product.value,page,pageSize:40});page=result.page;
    const fragment=document.createDocumentFragment();
    result.records.forEach(record=>{
      const li=node('li',undefined,'result-row');
      const link=node('a',record.code,'code-link');link.href=config.base+'codes/'+record.id+'/';
      const code=node('div',undefined,'code-cell');code.append(link);
      if (record.aliases?.length)code.append(node('span',record.aliases.slice(0,2).join(' · '),'alias'));
      const summary=node('div',undefined,'summary-cell');const title=node('a',record.title,'result-title');title.href=link.href;
      summary.append(title,node('p',record.situation||record.message,'result-summary'));
      const scope=node('div',undefined,'scope-cell');scope.append(node('span',record.vendor,'vendor-tag'),node('span',config.productLabels?.[record.product]??record.product,'product-label'));
      li.append(code,summary,scope);fragment.append(li);
    });
    if(!result.total) {const empty=node('li',undefined,'empty');empty.append(node('strong',tr('일치하는 코드를 찾지 못했습니다.')),node('p',tr('업체·제품 필터를 지우거나 오류 메시지의 코드 부분만 입력하세요.')));fragment.append(empty);}
    list.replaceChildren(fragment);
    count.textContent=(!loaded?tr('현재 목록 '): '')+tr('{count}개',{count:result.total.toLocaleString(config.locale||'ko-KR')});
    pager.replaceChildren();
    for(const [label,next] of [[tr('← 이전'),page-1],[page+' / '+result.pages,null],[tr('다음 →'),page+1]]) {
      if(next===null){pager.append(node('span',label));continue;}
      const button=node('button',label,'button');button.type='button';button.disabled=next<1||next>result.pages;
      button.addEventListener('click',()=>{page=next;render();$('results').scrollIntoView({block:'start',behavior:'auto'});});pager.append(button);
    }
    if(status)status.textContent=failed?tr('전체 검색 목록을 불러오지 못했습니다. 업체별 목록에서 계속 탐색할 수 있습니다.'):loaded?'':tr('전체 코드 목록을 불러오는 중입니다.');
    $('clear').hidden=!query.value&&!vendor.value&&!product.value;
  }
  query.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(()=>{page=1;render();},100);});
  query.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();clearTimeout(timer);page=1;render();}});
  vendor.addEventListener('change',()=>{updateProducts();page=1;render();});
  product.addEventListener('change',()=>{page=1;render();});
  $('clear').addEventListener('click',()=>{query.value='';vendor.value='';product.value='';updateProducts();page=1;render();query.focus();});
  vendor.value=config.vendor||'';updateProducts();render();
  fetch(config.index,{credentials:'same-origin'}).then(response=>{if(!response.ok)throw Error('Index unavailable');return response.json();}).then(index=>{records=prepare(index.records);loaded=true;render();}).catch(()=>{failed=true;render();});
}
