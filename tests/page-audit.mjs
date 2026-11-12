import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
let result;
export function fullPageAudit(){
 if(!result){
  const python=process.env.PYTHON_EXECUTABLE||(process.platform==='win32'?'python':'python3');
  const output=execFileSync(python,['-B','-X','utf8',fileURLToPath(new URL('../tools/check_pages.py',import.meta.url))],{encoding:'utf8',maxBuffer:1024*1024});
  result=JSON.parse(output.trim().split(/\r?\n/).at(-1));
  console.log(`${result.html_pages} HTML, ${result.internal_links_checked} internal links checked`);
 }
 return result;
}
