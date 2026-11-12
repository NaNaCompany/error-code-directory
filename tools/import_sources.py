"""Import the validated official-vendor collection, preserving licenses and provenance."""
import json, pathlib, shutil, hashlib, collections
ROOT = pathlib.Path(__file__).resolve().parents[1]
EVIDENCE = ROOT.parent / '.tools/error-code-portal-20261112'
out = ROOT / 'data'
out.mkdir(exist_ok=True)
records, sources, notices = [], [], []
for family in ('microsoft', 'platforms', 'vendors'):
    folder = EVIDENCE / family
    rows = json.loads((folder/'catalog.json').read_text(encoding='utf-8'))
    for r in rows:
        if r['product'] in ('Node.js', 'PostgreSQL', 'SQLite', 'Python'):
            r['vendor'] = r['product']
        records.append(r)
    allowed = {'id','title','url','source_url','license_id','license_name','license_url','creator','checked_at','sha256','modifications'}
    sources += [{k:v for k,v in s.items() if k in allowed} for s in json.loads((folder/'sources.json').read_text(encoding='utf-8'))]
    for path in sorted((folder/'licenses').iterdir()):
        if not path.is_file(): continue
        name = family+'-'+path.name+'.txt'
        target = out/'notices'/name
        target.parent.mkdir(exist_ok=True)
        shutil.copyfile(path,target)
        notices.append({'file':name,'family':family,'sha256':hashlib.sha256(target.read_bytes()).hexdigest()})
assert len({r['id'] for r in records}) == len(records), 'Duplicate ID'
assert len({(r['product'],r['code']) for r in records}) == len(records), 'Duplicate namespace/code'
assert len({s['id'] for s in sources}) == len(sources), 'Duplicate source ID'
source_ids = {s['id'] for s in sources}
assert all(r['source_id'] in source_ids for r in records)
records.sort(key=lambda r:(r['vendor'].lower(),r['product'].lower(),int(r['code']) if r['code'].isdigit() else 10**10,r['code']))
for name,obj in [('catalog',records),('sources',sources),('notices',notices)]:
    (out/(name+'.json')).write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
summary = {'records':len(records),'products':dict(collections.Counter(r['product'] for r in records)),'sources':len(sources),'status':dict(collections.Counter(r['status_kind'] for r in records))}
(out/'coverage.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(summary,ensure_ascii=False))
