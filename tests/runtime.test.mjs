import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import {prepare,find} from '../src/search.mjs';
const records=JSON.parse(fs.readFileSync(new URL('../data/catalog.json',import.meta.url),'utf8'));
const source=fs.readFileSync(new URL('../src/app.mjs',import.meta.url),'utf8').replace("import {prepare,find} from './search.mjs';",'');
class Element{
 constructor(tag='div',text=''){this.tag=tag;this.textContent=text;this.value='';this.children=[];this.listeners={};this.dataset={};}
 append(...children){this.children.push(...children);}replaceChildren(...children){this.children=children;}
 addEventListener(type,fn){this.listeners[type]=fn;}hasAttribute(n){return n==='data-copy-code'&&!!this.dataset.copyCode||n==='data-copy-link'&&this.link;}
 focus(){this.focused=true;}scrollIntoView(){this.scrolled=true;}fire(type,event={}){return this.listeners[type]?.(event);}
}
async function boot({failed=false,clipboardFailure=false,queryPage=true,ui={},locale='ko-KR',base='/error-code-directory/'}={}){
 const ids=Object.fromEntries(['page-config','status',...(queryPage?['query','vendor','product','result-list','result-count','result-pager','results','clear']:[])].map(x=>[x,new Element()]));
 ids['page-config'].textContent=JSON.stringify({base,index:'/error-code-directory/assets/index.json',initial:records.slice(0,40),products:records.map(r=>({product:r.product,vendor:r.vendor})),ui,locale,productLabels:{'Windows Installer 반환 코드':'Windows Installer return codes'}});
 const copy=new Element('button');copy.dataset.copyCode='ERROR_ACCESS_DENIED';const link=new Element('button');link.link=true;
 const requests=[],copied=[];
 const context={prepare,find,JSON,console,location:{origin:'https://nanalab.kr',pathname:'/error-code-directory/codes/windows-win32-5/'},navigator:{clipboard:{writeText:async s=>{if(clipboardFailure)throw Error('denied');copied.push(s);}}},document:{getElementById:id=>ids[id],querySelectorAll:()=>[copy,link],createElement:t=>new Element(t),createDocumentFragment:()=>new Element('fragment')},Option:function(text,value){const el=new Element('option',text);el.value=value;return el;},setTimeout:fn=>{fn();return 1;},clearTimeout:()=>{},fetch:async(url,opts)=>{requests.push({url,opts});if(failed)throw Error('offline');return{ok:true,json:async()=>({records})};}};
 vm.runInNewContext(source,context);for(let i=0;i<8;i++)await Promise.resolve();return{ids,copy,link,requests,copied};
}
test('search, vendor/product filters, clear and pagination run without submitting input',async()=>{
 const {ids,requests}=await boot();assert.equal(ids['result-count'].textContent,'4,836개');
 ids.query.value='0x80070005';ids.query.fire('input');assert.equal(ids['result-list'].children[0].children[0].children[0].children[0].textContent,'5');
 ids.vendor.value='SQLite';ids.vendor.fire('change');ids.query.value='';ids.query.fire('input');assert.equal(ids['result-count'].textContent,'101개');
 ids.product.value='SQLite';ids.product.fire('change');assert.equal(ids['result-count'].textContent,'101개');
 ids['result-pager'].children[2].fire('click');assert.equal(ids['result-pager'].children[1].textContent,'2 / 3');
 ids.clear.fire('click');assert.equal(ids.query.value,'');assert.equal(ids.vendor.value,'');assert.equal(ids.product.value,'');assert.equal(ids['result-count'].textContent,'4,836개');assert.ok(ids.query.focused);
 ids.query.value='<script>alert(1)</script>';ids.query.fire('input');assert.equal(ids['result-count'].textContent,'0개');
 assert.equal(requests.length,1);assert.equal(requests[0].url,'/error-code-directory/assets/index.json');assert.equal(requests[0].opts.credentials,'same-origin');assert.ok(!JSON.stringify(requests).includes('80070005'));
});
test('failed search-index fetch preserves static pagination and gives filtered fallback notice',async()=>{
 const {ids}=await boot({failed:true});assert.equal(ids['result-list'].children.length,0); // server-rendered DOM left untouched
 ids.query.value='unknown-code-zz';ids.query.fire('input');assert.ok(ids.status.textContent.includes('불러오지 못했습니다'));
});
test('detail buttons copy exact code and canonical path; rejected clipboard gives fallback',async()=>{
 const {copy,link,copied}=await boot({queryPage:false});await copy.fire('click');await link.fire('click');assert.deepEqual(copied,['ERROR_ACCESS_DENIED','https://nanalab.kr/error-code-directory/codes/windows-win32-5/']);
 const denied=await boot({queryPage:false,clipboardFailure:true});await denied.copy.fire('click');assert.ok(denied.ids.status.textContent.includes('선택해 복사'));
});
test('localized runtime labels and links retain original product filter keys',async()=>{
 const ui={'복사했습니다.':'Copied.','전체 제품':'All products','{count}개':'{count} codes','← 이전':'← Previous','다음 →':'Next →','일치하는 코드를 찾지 못했습니다.':'No matching codes.'};
 const {ids,copy}=await boot({ui,locale:'en-US',base:'/error-code-directory/en/'});assert.equal(ids['result-count'].textContent,'4,836 codes');
 ids.product.value='Windows Installer 반환 코드';ids.product.fire('change');assert.equal(ids['result-count'].textContent,'59 codes');
 assert.ok(ids['result-list'].children[0].children.every(row=>row.children[0].children[0].href.startsWith('/error-code-directory/en/codes/')));
 await copy.fire('click');assert.equal(ids.status.textContent,'Copied.');assert.equal(ids.product.value,'Windows Installer 반환 코드');
});
