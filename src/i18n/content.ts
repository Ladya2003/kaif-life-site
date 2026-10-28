import ru from './articles-ru.json';
import en from './articles-en.json';
import es from './articles-es.json';
import { stories, episodes, socials } from '../data/site';
import { translate, type Locale } from './index';
export const storySlugs = ['georgia-first-days','georgia-excursions','kazbegi-paragliding','car-challenge-behind-the-scenes','car-challenge-ab-tests'] as const;
export type StorySlug = typeof storySlugs[number];
export const featuredStorySlugs = ['georgia-first-days','georgia-excursions','kazbegi-paragliding'] as const;
export function getFeaturedStories(locale:Locale) {
 const stories=getStories(locale);
 return featuredStorySlugs.map(slug=>stories.find(story=>story.slug===slug)!);
}
const translatedArticles = { en, es };
export function getArticle(locale:Locale, slug:StorySlug) {
 const article=ru[slug];
 return locale==='ru'?article:{...article,...translatedArticles[locale][slug]};
}
export function getStories(locale:Locale) {
 return stories.map(story=>{
  const slug=story.slug as StorySlug;
  const article=getArticle(locale,slug);
  const words=article.body.replace(/<[^>]+>/g,' ').split(/\s+/).filter(Boolean).length;
  const minutes=Math.max(1,Math.ceil(words/180));
  const time=locale==='ru'?`${minutes} ${minutes===1?'минута':minutes<5?'минуты':'минут'}`:`${minutes} min`;
  if(locale==='ru') return {...story,time};
  const translated=translatedArticles[locale][slug];
  return {...story,title:translated.cardTitle,description:translated.cardDescription,label:article.label,alt:article.alt,time};
 });
}
export function getSocials(locale:Locale) {
 const t=translate(locale);
 const keys=['social.youtube','social.instagram','social.tiktok','social.telegram'] as const;
 return socials.map((s,index)=>({...s,note:t(keys[index])}));
}
export function getEpisodes(locale:Locale) {
 if(locale==='ru') return episodes;
 const text=locale==='en'?[
  ['Ferrari in Vilnius','Ferrari in a car museum in Vilnius','A trip around Europe','There’s always time for a car museum on my travels.'],
  ['Karting in Georgia','Vlad driving a kart in Georgia','One more lap?','Kakheti, wine, the city of love. But you know what I was looking forward to most.'],
  ['Five years dreaming of a Tesla','','A dream came true','And I finally drove one. Some dreams start with a simple rental.'],
 ]:[
  ['Un Ferrari en Vilna','Un Ferrari en un museo del automóvil de Vilna','Un viaje por Europa','En mis viajes siempre hay tiempo para un museo del automóvil.'],
  ['Karting en Georgia','Vlad conduciendo un kart en Georgia','¿Otra vuelta?','Kajetia, vino, la ciudad del amor. Pero ya sabéis lo que más ilusión me hacía.'],
  ['Cinco años soñando con un Tesla','','Un sueño cumplido','Y por fin lo conduje. Algunos sueños empiezan con un simple alquiler.'],
 ];
 return episodes.map((e,i)=>({...e,title:text[i][0],alt:text[i][1],tag:text[i][2],caption:text[i][3]}));
}
