import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir, readdir } from 'node:fs/promises';
import assert from 'node:assert/strict';

const base='http://127.0.0.1:4325';
const site='https://kaif-life.com';
const locales=['ru','en','es'];
const paths=['/','/stories/','/stories/georgia-first-days/','/stories/georgia-excursions/','/stories/kazbegi-paragliding/','/stories/car-challenge-behind-the-scenes/','/stories/car-challenge-ab-tests/'];
const localize=(locale,path)=>`${locale==='ru'?'':`/${locale}`}${path}`;
const server=spawn(process.execPath,['node_modules/astro/bin/astro.mjs','preview','--host','127.0.0.1','--port','4325'],{cwd:process.cwd(),windowsHide:true,stdio:'pipe'});
let browser;

async function checkImageFrame(image,label){
 const dimensions=await image.evaluate(img=>({width:img.getBoundingClientRect().width,height:img.getBoundingClientRect().height,naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight,maxHeight:getComputedStyle(img).maxHeight}));
 assert(dimensions.naturalWidth>0,`Image loaded: ${label}`);
 assert(Math.abs(dimensions.height-dimensions.width*dimensions.naturalHeight/dimensions.naturalWidth)<2,`Uncropped image: ${label} ${JSON.stringify(dimensions)}`);
 assert.equal(dimensions.maxHeight,'none',`No prose image clamp: ${label}`);
}

try{
 let ready=false;
 for(let i=0;i<80;i++){try{if((await fetch(base)).ok){ready=true;break;}}catch{}await new Promise(resolve=>setTimeout(resolve,250));}
 assert(ready,'Preview did not start');
 browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 await mkdir('artifacts',{recursive:true});
 for(const width of [1440,768,390,320]){
  const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce'});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{if(response.status()>=400)errors.push(`${response.status()} ${response.url()}`);});
  for(const locale of locales){
   const routes=width===768?['/','/stories/georgia-first-days/']:paths;
   for(const path of routes){
    const route=localize(locale,path);
    const response=await page.goto(base+route,{waitUntil:'networkidle'});
    assert.equal(response.status(),200,route);
    assert.equal(await page.locator('html').getAttribute('lang'),locale,`HTML language: ${route}`);
    assert.equal(await page.locator('h1').count(),1,`One H1: ${route}`);
    const text=await page.locator('body').innerText();
    if(path==='/'){assert.deepEqual(await page.locator('#journal .story-card').evaluateAll(links=>links.map(link=>link.getAttribute('href'))),['georgia-first-days','georgia-excursions','kazbegi-paragliding'].map(slug=>localize(locale,`/stories/${slug}/`)));}
    if(path==='/stories/'){assert.equal(await page.locator('.story-card').count(),5);}
    if(path.startsWith('/stories/car-challenge-')){assert.equal(await page.locator('.article-media').count(),4);for(const media of await page.locator('.article-media img').all())await media.evaluate(img=>img.loading='eager');}
    if(path==='/stories/car-challenge-ab-tests/'){assert.equal(await page.locator('.prose tbody tr').count(),3);}
    assert(!/[↗↖↓←✳♡▷💤]/u.test(text),`No platform-dependent icon characters: ${route}`);
    assert(!/[?]{3}/.test(text),`No encoding damage: ${route}`);
    if(locale!=='ru')assert(!/[А-Яа-яЁё]/.test(text),`Fully translated body: ${route}`);
    const canonical=site+route;
    assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'),canonical);
    assert.equal(await page.locator('meta[property="og:url"]').getAttribute('content'),canonical);
    assert(await page.locator('meta[name="description"]').getAttribute('content'));
    const alternates=await page.locator('link[rel="alternate"][hreflang]').evaluateAll(links=>Object.fromEntries(links.map(link=>[link.getAttribute('hreflang'),link.getAttribute('href')])));
    assert.deepEqual(alternates,Object.fromEntries([...locales.map(lang=>[lang,site+localize(lang,path)]),['x-default',site+path]]),`Reciprocal hreflang set: ${route}`);
    const languageLinks=await page.locator('.language-switch a').evaluateAll(links=>links.map(link=>link.getAttribute('href')));
    assert.deepEqual(languageLinks,locales.map(lang=>localize(lang,path)),`Preserve page when switching language: ${route}`);
    const graph=JSON.parse(await page.locator('script[type="application/ld+json"]').innerText())['@graph'];
    assert(graph.some(node=>node['@type']==='Person'));
    assert(graph.some(node=>node['@type']==='WebSite'));
    assert(graph.some(node=>node['@type']==='BreadcrumbList'));
    const isArticle=path.startsWith('/stories/')&&path!=='/stories/';
    if(isArticle){const article=graph.find(node=>node['@type']==='BlogPosting');assert(article,route);assert.equal(article.inLanguage,locale);assert.equal(article.mainEntityOfPage,canonical);assert.equal(article.headline,await page.locator('h1').innerText());}
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
    if(overflow){console.log(JSON.stringify(await page.locator('body *').evaluateAll(elements=>elements.filter(el=>el.getBoundingClientRect().right>innerWidth+1).map(el=>({tag:el.tagName,cls:el.className,right:el.getBoundingClientRect().right})).slice(0,15))));}
    assert(!overflow,`No horizontal overflow ${width}: ${route}`);
    await page.evaluate(async()=>{for(const image of document.images)image.loading='eager';await Promise.all([...document.images].map(image=>image.decode().catch(()=>{})));});
    assert.deepEqual(await page.locator('img').evaluateAll(images=>images.filter(img=>!img.complete||!img.naturalWidth||!img.getAttribute('alt')||!img.getAttribute('width')||!img.getAttribute('height')).map(img=>img.src)),[],`Images and dimensions: ${route}`);
    for(const href of await page.locator('a[href^="/"]').evaluateAll(links=>[...new Set(links.map(link=>link.getAttribute('href')))])){
     const target=new URL(href,base);assert((await fetch(target)).ok,`Local link: ${href}`);
     if(target.hash&&target.pathname===new URL(page.url()).pathname)assert(await page.locator(target.hash).count(),`Anchor: ${href}`);
    }
    for(const pair of await page.locator('[data-pair]').all()){
     const button=pair.locator('button');
     if(isArticle){await checkImageFrame(pair.locator('.pair-images > img'),route);const gap=await pair.evaluate(el=>el.querySelector('figcaption').getBoundingClientRect().top-el.querySelector('.pair-images').getBoundingClientRect().bottom);assert(gap<30,`No blank space after photograph: ${route}`);}
     await button.click();assert.equal(await button.getAttribute('aria-pressed'),'true');assert.equal(await button.locator('svg[data-icon="arrow-up-right"]').count(),1);assert(await pair.locator('.pair-second').isVisible());
     if(isArticle)await checkImageFrame(pair.locator('.pair-second img'),route+' second');
     if(isArticle&&width===1440)await pair.screenshot({path:`artifacts/article-pair-${locale}.png`});
     await button.click();assert.equal(await button.getAttribute('aria-pressed'),'false');assert.equal(await button.locator('svg[data-icon="arrow-up-right"]').count(),1);assert(!await pair.locator('.pair-second').isVisible());
    }
    if(isArticle)await checkImageFrame(page.locator('.article-cover img'),route+' cover');
    if(path.startsWith('/stories/car-challenge-')){
     for(const image of await page.locator('.article-media img').all())await checkImageFrame(image,route+' media');
     const sibling=path.includes('behind-the-scenes')?'car-challenge-ab-tests':'car-challenge-behind-the-scenes';
     assert(await page.locator(`.related a[href="${localize(locale,`/stories/${sibling}/`)}"]`).count());
     if(width===1440&&locale==='ru')await page.screenshot({path:`artifacts/${sibling==='car-challenge-ab-tests'?'production':'ab-tests'}-ru.png`,fullPage:true});
    }
    if(path==='/'&&(width===1440||width===390)){
     await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';window.scrollTo(0,0);});
     await page.screenshot({path:`artifacts/hero-${locale}-${width}.png`});
    }
   }
  }
  assert.deepEqual(errors,[],'No browser errors');
  await page.close();
  console.log(`PASS viewport ${width}: translated pages, metadata, links and full photograph frames.`);
 }
 for(const locale of locales){
  const page=await browser.newPage({javaScriptEnabled:false,viewport:{width:390,height:844}});
  await page.goto(base+localize(locale,'/stories/georgia-first-days/'));
  assert(await page.locator('h1').isVisible());assert.equal(await page.locator('.pair-toggle:visible').count(),0);assert.equal(await page.locator('.language-switch a').count(),3);
  await page.goto(base+localize(locale,locale==='ru'?'/404.html':'/404/'));
  assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'),'noindex, follow');assert.equal(await page.locator('link[hreflang]').count(),0);
  await page.close();
 }
 const sitemap=await (await fetch(base+'/sitemap.xml')).text();
 const urls=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match=>match[1]);
 assert.deepEqual(urls,locales.flatMap(locale=>paths.map(path=>site+localize(locale,path))));
 for(const url of urls)assert((await fetch(url.replace(site,base))).ok,`Sitemap URL resolves: ${url}`);
 assert((await (await fetch(base+'/robots.txt')).text()).includes(site+'/sitemap.xml'));
 assert.equal((await readdir('dist/images')).some(name=>name==='originals'),false);
 console.log('PASS: 21 indexable pages, 3 noindex error pages, 4 widths, localized navigation, schema, hreflang, sitemap, images and photo-pair regression.');
}finally{await browser?.close();server.kill();}
