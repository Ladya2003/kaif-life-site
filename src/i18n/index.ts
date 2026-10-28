import messages from './ui.json';
export const locales = ['ru','en','es'] as const;
export type Locale = typeof locales[number];
export type MessageKey = keyof typeof messages.ru;
export function translate(locale: Locale) { return (key: MessageKey) => messages[locale][key]; }
export function localizedPath(locale:Locale,path='/') { return `${locale==='ru'?'':`/${locale}`}${path}`; }
export function unlocalizedPath(path:string) { return path.replace(/^\/(en|es)(?=\/|$)/,'') || '/'; }
export const languageNames={ru:'Русский',en:'English',es:'Español'};
export const ogLocales={ru:'ru_RU',en:'en_US',es:'es_ES'};
