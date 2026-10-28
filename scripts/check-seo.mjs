import {readFile, access} from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';

const site='https://kaif-life.com';
const locales=['ru','en','es'];
const paths=['/','/stories/','/stories/georgia-first-days/','/stories/georgia-excursions/','/stories/kazbegi-paragliding/','/stories/car-challenge-behind-the-scenes/','/stories/car-challenge-ab-tests/'];
const localize=(locale,route)=>`${locale==='ru'?'':`/${locale}`}${route}`;
const decode=value=>value.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&#x27;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
const attributes=tag=>Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(match=>[match[1],decode(match[2])]));
const tags=(html,name)=>[...html.matchAll(new RegExp(`<${name}\\b[^>]*>`,'g'))].map(match=>attributes(match[0]));
const fileFor=route=>path.join('dist',route.endsWith('/')?`${route}index.html`:route);
function meta(html,key,value){const values=tags(html,'meta').filter(attrs=>attrs[key]===value);assert.equal(values.length,1,`One ${value} meta`);return values[0].content;}
async function imageExists(url){assert(url.startsWith(`${site}/images/`),`Local absolute image URL: ${url}`);await access(fileFor(new URL(url).pathname));}
const titles=new Set();
const descriptions=new Set();

for(const locale of locales){
 for(const route of paths){
  const localized=localize(locale,route);
  const canonical=site+localized;
  const html=await readFile(fileFor(localized),'utf8');
  assert.equal(tags(html,'html')[0].lang,locale);
  assert.equal((html.match(/<h1\b/g)||[]).length,1,`One H1 in raw HTML: ${localized}`);
  const main=html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1];
  assert(main,`Static main exists: ${localized}`);
  assert(main.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim().length>250,`Main text exists before JS: ${localized}`);
  assert(!html.includes('seo-bootstrap'),`No hidden bootstrap content: ${localized}`);
  assert(!/<main[^>]*(?:hidden|display\s*:\s*none)/i.test(html));
  assert(!main.includes('[media:'));
  if(route==='/'){
   const cards=[...main.matchAll(/<a\b[^>]*class="story-card[^"]*"[^>]*href="([^"]+)"/g)].map(match=>match[1]);
   assert.deepEqual(cards,['georgia-first-days','georgia-excursions','kazbegi-paragliding'].map(slug=>localize(locale,`/stories/${slug}/`)),`Original home stories: ${locale}`);
  }
  assert(!main.includes('[pair]')&&!main.includes('[landscape]')&&!main.includes('[sleep]'));
  const title=decode(html.match(/<title>([\s\S]*?)<\/title>/)[1]);
  assert(!titles.has(title),`Unique title: ${localized}`);titles.add(title);
  const description=meta(html,'name','description');
  assert(description.length>40,`Useful description: ${localized}`);
  assert(!descriptions.has(description),`Unique description: ${localized}`);descriptions.add(description);
  assert.equal(tags(html,'link').filter(link=>link.rel==='canonical').length,1);
  assert.equal(tags(html,'link').find(link=>link.rel==='canonical').href,canonical);
  const alternates=Object.fromEntries(tags(html,'link').filter(link=>link.hreflang).map(link=>[link.hreflang,link.href]));
  assert.deepEqual(alternates,Object.fromEntries([...locales.map(lang=>[lang,site+localize(lang,route)]),['x-default',site+route]]));
  assert.equal(meta(html,'property','og:title'),title);
  assert.equal(meta(html,'property','og:description'),description);
  assert.equal(meta(html,'property','og:url'),canonical);
  const image=meta(html,'property','og:image');await imageExists(image);
  assert.equal(meta(html,'property','og:image:width'),'1200');assert.equal(meta(html,'property','og:image:height'),'630');
  assert.equal(meta(html,'name','twitter:image'),image);
  assert.equal(meta(html,'name','twitter:title'),title);
  assert(!meta(html,'name','robots').includes('noindex'));
  const schemas=[...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(match=>JSON.parse(match[1]));
  assert.equal(schemas.length,1);
  const graph=schemas[0]['@graph'];
  assert(graph.find(node=>node['@type']==='Person'));
  assert(graph.find(node=>node['@type']==='WebSite'));
  assert(graph.find(node=>['WebPage','CollectionPage'].includes(node['@type'])));
  assert(graph.find(node=>node['@type']==='BreadcrumbList'));
  if(route.startsWith('/stories/')&&route!=='/stories/'){
   const article=graph.find(node=>node['@type']==='BlogPosting');assert(article);
   assert.equal(article.inLanguage,locale);assert.equal(article.mainEntityOfPage,canonical);
   assert(article.author['@id']);assert(article.publisher['@id']);
   assert.equal(article.image.length,3);
   for(const image of article.image)await imageExists(image);
   assert(image.includes('/previews/'),`Article has its own social image: ${localized}`);
  }
 }
 const error=await readFile(fileFor(localize(locale,locale==='ru'?'/404.html':'/404/')),'utf8');
 assert(meta(error,'name','robots').includes('noindex'));
}
const sitemap=await readFile('dist/sitemap.xml','utf8');
const urls=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match=>decode(match[1]));
assert.deepEqual(urls,locales.flatMap(locale=>paths.map(route=>site+localize(locale,route))));
for(const url of urls)await access(fileFor(new URL(url).pathname));
assert((await readFile('dist/robots.txt','utf8')).includes(`Sitemap: ${site}/sitemap.xml`));
console.log('PASS SEO: 21 complete static pages; unique metadata; reciprocal languages; canonical sitemap; real preview images; BlogPosting; noindex errors.');
