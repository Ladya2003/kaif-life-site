import type {APIRoute} from 'astro';
import {storySlugs} from '../i18n/content';
import {locales,localizedPath} from '../i18n';
export const GET:APIRoute=()=>{
 const paths=['/','/stories/',...storySlugs.map(slug=>`/stories/${slug}/`)];
 const urls=locales.flatMap(locale=>paths.map(path=>`<url><loc>https://kaif-life.com${localizedPath(locale,path)}</loc></url>`));
 return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`,{headers:{'Content-Type':'application/xml; charset=utf-8'}});
};
