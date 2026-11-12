// Publisher identifiers verified against the current NaNa main-site source.
export const IDS = {ga:'G-2ZYSF0173P',gtm:'GTM-NV2WWQXB',ads:'ca-pub-9767176956440077',cf:'9f3423bb0d034d91bbe1a12afeff2429'};
export const HEAD = `<!-- NaNa publisher integrations: GA4, GTM, AdSense, Cloudflare -->
<script>(function(){
if(!['nanalab.kr','www.nanalab.kr','nanacompany.github.io'].includes(location.hostname.toLowerCase()))return;
function load(src,attrs){var s=document.createElement('script');s.async=true;s.src=src;for(var k in attrs)s.setAttribute(k,attrs[k]);document.head.appendChild(s);}
window.dataLayer=window.dataLayer||[];window.gtag=window.gtag||function(){window.dataLayer.push(arguments);};
window.dataLayer.push({'gtm.start':Date.now(),event:'gtm.js'});
load('https://www.googletagmanager.com/gtm.js?id=${IDS.gtm}',{});
gtag('js',new Date());gtag('config','${IDS.ga}',{page_location:location.origin+location.pathname,page_referrer:document.referrer?document.referrer.split(/[?#]/)[0]:''});
load('https://www.googletagmanager.com/gtag/js?id=${IDS.ga}',{});
load('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${IDS.ads}',{crossorigin:'anonymous'});
function beacon(){if(document.querySelector('script[src*="static.cloudflareinsights.com/beacon.min.js"]'))return;load('https://static.cloudflareinsights.com/beacon.min.js',{'data-cf-beacon':JSON.stringify({token:'${IDS.cf}'})});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',beacon,{once:true});else beacon();
})();</script><!-- /NaNa publisher integrations -->`;
export const NOSCRIPT = `<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${IDS.gtm}" height="0" width="0" style="display:none;visibility:hidden" title="Google Tag Manager"></iframe></noscript>`;
export const BOOK = '<script defer src="https://nanalab.kr/src_cdn/banner/astra.js"></script>';
