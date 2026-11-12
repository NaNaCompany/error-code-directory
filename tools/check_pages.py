"""Independent full-file, route, translation, publisher and sitemap audit."""
import pathlib,json,hashlib,re,html,concurrent.futures,xml.etree.ElementTree as ET,time
app=pathlib.Path(__file__).resolve().parents[1];docs=app/'docs'
load=lambda p:json.loads(p.read_text(encoding='utf-8'))
manifest=load(docs/'build-manifest.json');files=manifest['files'];langs=['ko','en','ja','zh','es','de','fr','pt','ru'];records=load(app/'data/catalog.json');byid={r['id']:r for r in records};translations={l:load(app/'data/i18n'/f'{l}.json') for l in langs if l!='en'}
assert len(records)==4836;assert manifest['html_pages']==45783;assert manifest['sitemap_urls']==45774
prefix='/error-code-directory/';origin='https://nanalab.kr';ids=['G-2ZYSF0173P','GTM-NV2WWQXB','ca-pub-9767176956440077','9f3423bb0d034d91bbe1a12afeff2429']
url=lambda l,p:origin+prefix+('' if l=='ko' else l+'/')+p
ref=re.compile(r'(?:href|src)="(/error-code-directory/[^"#]*)(?:#[^"]*)?"')
original=re.compile(r'<div class="message" lang="en">([\s\S]*?)</div>')
native=re.compile(r'<div class="message translated-message" lang="([^"]+)">([\s\S]*?)</div>')
def audit(item):
 name,expected=item;data=(docs/name).read_bytes();assert hashlib.sha256(data).hexdigest()==expected,'Hash mismatch '+name
 if not name.endswith('.html'):return (0,0,0)
 text=data.decode('utf-8');parts=name.split('/');lang=parts[0] if parts[0] in langs[1:] else 'ko';rel=name[len(lang)+1:] if lang!='ko' else name;route=rel.removesuffix('index.html')
 assert text.startswith('<!doctype html><html lang="'+lang+'">'),name+' language'
 assert all(i in text for i in ids),name+' publisher'
 assert '<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-NV2WWQXB"' in text,name+' noscript'
 assert '<script defer src="https://nanalab.kr/src_cdn/banner/astra.js"></script>' in text,name+' banner'
 assert text.count('rel="canonical"')==1 and f'rel="canonical" href="{url(lang,route)}"' in text,name+' canonical'
 assert text.count('aria-current="page"')==1,name+' selected locale'
 for other in langs:
  expected_url=url(other,route);assert f'rel="alternate" hreflang="{other}" href="{expected_url}"' in text,name+' hreflang'
  assert f'hreflang="{other}" href="{expected_url.removeprefix(origin)}"' in text,name+' same-route switcher'
 assert f'hreflang="x-default" href="{url("ko",route)}"' in text,name+' x-default'
 links=0
 for m in ref.finditer(text):
  target=html.unescape(m[1]).removeprefix(prefix)
  if not target or target.endswith('/'):target+='index.html'
  assert target in files,name+' broken internal route '+target;links+=1
 detail=0
 if rel.startswith('codes/'):
  code_id=rel.split('/')[1];r=byid[code_id];assert '<h1 class="code-display">'+html.escape(r['code'],quote=False)+'</h1>' in text,name+' code'
  assert html.unescape(original.search(text)[1])==r['message'],name+' original changed'
  if lang!='en':
   m=native.search(text);assert m and m[1]==lang and html.unescape(m[2])==translations[lang]['messages'][code_id],name+' native description mismatch'
   provider=translations[lang].get('message_providers',{}).get(code_id,translations[lang]['provider']);assert html.escape(provider,quote=False) in text,name+' provider'
  assert all(html.escape(l['url'],quote=True).replace('&#x27;','&#39;') in text for l in r['solution_links']),name+' diagnostic link lost'
  detail=1
 if rel=='404.html':assert 'content="noindex,follow"' in text
 else:assert 'content="noindex' not in text
 return (1,detail,links)
t=time.time();counts=[0,0,0]
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
 for n,result in enumerate(pool.map(audit,files.items()),1):
  counts=[a+b for a,b in zip(counts,result)]
  if n%2000==0:print(f'Checked {n}/{len(files)} files; HTML {counts[0]}, details {counts[1]}',flush=True)
assert counts[0]==45783 and counts[1]==43524
ns={'s':'http://www.sitemaps.org/schemas/sitemap/0.9'};index=ET.parse(docs/'sitemap.xml').getroot();assert index.tag.endswith('sitemapindex');locations=[n.text for n in index.findall('s:sitemap/s:loc',ns)];assert set(locations)=={origin+prefix+'sitemap-'+l+'.xml' for l in langs}
allurls=set()
for lang in langs:
 leaf=ET.parse(docs/f'sitemap-{lang}.xml').getroot();assert leaf.tag.endswith('urlset');urls=[n.text for n in leaf.findall('s:url/s:loc',ns)];assert len(urls)==len(set(urls))==5086
 for r in records:assert url(lang,'codes/'+r['id']+'/') in urls
 assert not allurls.intersection(urls);allurls.update(urls)
assert len(allurls)==45774
result={'status':'passed','files_sha256_verified':len(files),'html_pages':counts[0],'detail_pages':counts[1],'internal_links_checked':counts[2],'languages':langs,'sitemap_urls':len(allurls),'leaf_sitemaps':9,'seconds':round(time.time()-t,2)}
print(json.dumps(result,ensure_ascii=False),flush=True)
