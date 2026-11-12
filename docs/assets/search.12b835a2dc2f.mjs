export const normalize = value => String(value??'').normalize('NFKC').toLocaleLowerCase('en-US').replace(/\s+/g,' ').trim();
export function codeForms(record) {
  const forms = new Set([record.code,...(record.aliases||[])]);
  // Win32 facility 7 HRESULTs use the documented HRESULT_FROM_WIN32 mapping.
  // Installer message numbers are a separate namespace and are never converted.
  if (/Windows Win32|Windows Installer 반환 코드/.test(record.product) && /^\d+$/.test(record.code)) {
    const n=Number(record.code);
    if (n>0 && n<=65535) {
      forms.add('0x'+n.toString(16).padStart(8,'0').toUpperCase());
      forms.add('0x'+((0x80070000|n)>>>0).toString(16).toUpperCase());
    }
  }
  return [...forms];
}
export function prepare(records) {
  return records.map(record=>({...record,_codes:codeForms(record).map(normalize),_search:normalize([record.vendor,record.product,record.code,...(record.aliases||[]),record.title,record.situation,record.message,record.original_message].join(' '))}));
}
function tokens(query) {
  return (normalize(query).match(/0x[0-9a-f]+|[a-z_][a-z0-9_./:-]*|\d+|[가-힣]+|[\p{L}\p{N}]+/gu)||[]).map(t=>t.replace(/[.:]+$/,''));
}
export function find(records,{query='',vendor='',product='',page=1,pageSize=40}={}) {
  const q=normalize(query),parts=tokens(q);
  const hex=parts.filter(x=>/^0x[0-9a-f]+$/.test(x)).flatMap(x=>{const n=Number.parseInt(x.slice(2),16);return Number.isFinite(n)?['0x'+n.toString(16).padStart(8,'0')]:[];});
  const candidates=records.filter(r=>(!vendor||r.vendor===vendor)&&(!product||r.product===product)).map((r,index)=>{
    const codes=r._codes||codeForms(r).map(normalize),hay=r._search||normalize([r.code,...(r.aliases||[]),r.title,r.message,r.situation,r.product,r.vendor].join(' '));
    const exact=codes.includes(q)||hex.some(x=>codes.includes(x));
    // Pasted messages often contain one exact diagnostic identifier plus prose.
    const diagnostic=parts.filter(t=>/^0x|^aadsts|^sqlstate|^err_|^error_|^sqlite_|^auth\/|^[0-9]{3,8}$/.test(t));
    const embedded=diagnostic.some(t=>codes.includes(t));
    const matched=!q||exact||embedded||(parts.length&&parts.every(t=>hay.includes(t)));
    return {record:r,index,score:exact?0:embedded?1:codes.some(c=>c.startsWith(q))?2:3,matched};
  }).filter(x=>x.matched);
  candidates.sort((a,b)=>a.score-b.score||a.index-b.index);
  const pages=Math.max(1,Math.ceil(candidates.length/pageSize));
  const current=Math.min(pages,Math.max(1,Number.isInteger(page)?page:1));
  return {total:candidates.length,pages,page:current,records:candidates.slice((current-1)*pageSize,current*pageSize).map(x=>x.record)};
}
