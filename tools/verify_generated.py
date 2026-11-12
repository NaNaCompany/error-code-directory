"""Compare source-derived expected hashes with every actual output file."""
import sys,json,pathlib,hashlib,concurrent.futures,os,stat
root=pathlib.Path(sys.argv[1]).resolve();expected=json.loads(sys.stdin.buffer.read().decode('utf-8'));bad=[]
def check(item):
 name,want=item;p=root/name
 try:return None if hashlib.sha256(p.read_bytes()).hexdigest()==want else name
 except OSError:return name
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
 for result in pool.map(check,expected.items()):
  if result:bad.append(result)
actual=set();links=[]
for directory,dirs,names in os.walk(root,followlinks=False):
 for name in dirs+names:
  p=pathlib.Path(directory)/name;info=p.lstat()
  if stat.S_ISLNK(info.st_mode) or getattr(info,'st_file_attributes',0)&getattr(stat,'FILE_ATTRIBUTE_REPARSE_POINT',0):links.append(str(p.relative_to(root)))
 for name in names:actual.add((pathlib.Path(directory)/name).relative_to(root).as_posix())
extra=sorted(actual-set(expected));missing=sorted(set(expected)-actual)
result={'status':'passed' if not(bad or extra or missing or links) else 'failed','files_read':len(expected),'mismatches':bad[:20],'extra':extra[:20],'missing':missing[:20],'links':links[:20]}
print(json.dumps(result));raise SystemExit(result['status']!='passed')
