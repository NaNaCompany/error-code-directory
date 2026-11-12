"""Safe local preview: no publisher scripts or external network resources."""
import http.server, pathlib, re, urllib.parse
ROOT=pathlib.Path(__file__).resolve().parents[1]/'docs'
BASE='/error-code-directory/'
class Handler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self,p):
        p=urllib.parse.unquote(urllib.parse.urlsplit(p).path)
        if p.startswith(BASE): p=p[len(BASE):]
        p=(ROOT/p.lstrip('/')).resolve()
        if not p.is_relative_to(ROOT): return str(ROOT/'404.html')
        return str(p)
    def end_headers(self):
        self.send_header('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-src 'none'; connect-src 'self'; object-src 'none'; base-uri 'self'")
        self.send_header('Cache-Control','no-store')
        super().end_headers()
    def do_GET(self):
        path=pathlib.Path(self.translate_path(self.path))
        if path.is_dir():path=path/'index.html'
        if path.is_file() and path.suffix=='.html':
            s=path.read_text(encoding='utf-8')
            s=re.sub(r'<!-- NaNa publisher integrations:.*?<!-- /NaNa publisher integrations -->','',s,flags=re.S)
            s=re.sub(r'<noscript><iframe.*?</iframe></noscript>','',s,flags=re.S)
            s=re.sub(r'<script defer src="https://nanalab.kr/src_cdn/banner/astra.js"></script>','',s)
            body=s.encode();self.send_response(200);self.send_header('Content-Type','text/html; charset=utf-8');self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body)
        else:super().do_GET()
    extensions_map={**http.server.SimpleHTTPRequestHandler.extensions_map,'.mjs':'application/javascript','.json':'application/json','.xml':'application/xml','.txt':'text/plain; charset=utf-8'}
if __name__=='__main__':
    print('Preview: http://127.0.0.1:8788/error-code-directory/',flush=True)
    http.server.ThreadingHTTPServer(('127.0.0.1',8788),Handler).serve_forever()
