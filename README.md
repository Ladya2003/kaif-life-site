# KAIF LIFE

Статический сайт Влада: путешествия, автомобильные челленджи, личные истории и Amorely.
Astro, без бэкенда и внешних шрифтов. Изображения обслуживаются вместе с сайтом.

## Локальный просмотр

Требуется Node.js 22.12+; в текущем окружении проверено на 22.20.

```sh
npm ci
npm run dev
```

Открыть адрес, который напечатает Astro: обычно http://127.0.0.1:4321.
Проверки: `npm run check`, `npm run build`, `npm run test:seo`, `npm run test:smoke`.
Браузерная проверка охватывает три языка, четыре ширины экрана, hreflang, canonical, sitemap, ссылки и оба состояния фотографий в статьях.
Сборка: `dist/`. Просмотр готовой сборки: `npm run preview`.

## Структура

- `src/components/Home.astro` — общий шаблон главной для всех языков.
- `src/pages/index.astro` — русская главная; `src/pages/[locale]/` — английские и испанские маршруты.
- `src/pages/stories/` — русские адреса статей и списка историй.
- `src/i18n/ui.json` — переводы интерфейса на русский, английский и испанский.
- `src/i18n/articles-{ru,en,es}.json` — полные тексты статей и описания.
- `src/i18n/content.ts` — локализованные карточки, соцсети и вычисление времени чтения.
- `docs/SEO.md` — адреса переводов и проверка индексации после публикации.
- `src/data/site.ts` — соцсети, карточки и видео.
- `src/styles/global.css` — адаптивное оформление.
- `docs/PHOTO-CONTENT.md` — контекст фотографий со слов автора.
- `docs/AUTHOR.md` — история Amorely и контакты.
- `public/images/` — WebP в трёх размерах, EXIF не переносится.
- `public/images/previews/` — готовые превью статей для социальных сетей и поисковой разметки; сборка не требует Python.
- `scripts/check-seo.mjs` — проверка готового HTML перед публикацией в GitHub Pages.
- `assets/originals/` — локальные оригиналы, исключены из Git и сборки.

Оригиналы можно получить у владельца отдельно. Сайт собирается из подготовленных изображений без Python.
Скрипт smoke сам запускает preview на порту 4325 и останавливает его после проверки.
Для браузерных проверок используется установленный Edge. Другой Chromium можно задать переменной `BROWSER_PATH`.
Скриншоты сохраняются в локальной папке `artifacts/`.

## GitHub Pages и kaif-life.com

Пошаговая инструкция и точные DNS-записи: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

Workflow `.github/workflows/deploy.yml` собирает сайт при push в main или ручном запуске.
Перед первым запуском:

1. В Settings → Pages репозитория выбрать Source: GitHub Actions.
2. Добавить Custom domain: `kaif-life.com`. Файл `public/CNAME` подготовлен.
3. Настроить DNS по актуальной инструкции GitHub Pages и дождаться проверки.
4. Включить Enforce HTTPS после выдачи сертификата.

`site` в `astro.config.mjs` указывает на собственный домен; `base` не задан.
Текущая сборка рассчитана на корень `kaif-life.com`, а не на подпуть `Ladya2003.github.io/kaif-life-site/`.
Настройки GitHub и DNS пока не менялись, публикация не выполнялась.

- Astro: https://docs.astro.build/en/guides/deploy/github/
- GitHub: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site

## Материалы

Статьи подготовлены по пояснениям автора и расшифровкам в `C:/Projects/kaif-life/data/transcripts/`.
Это личные впечатления и выводы; справочник текущих цен не публикуется.
Тексты от первого лица стоит прочитать автору перед публикацией.

## Новые истории

Добавлены статьи `car-challenge-behind-the-scenes` (съёмка и монтаж) и `car-challenge-ab-tests` (названия и превью) на всех трёх языках.
Карточки главной закреплены в `featuredStorySlugs` в `src/i18n/content.ts`; новые статьи попадают в общий дневник и sitemap.
Медиа `[media:27]`–`[media:34]` в тексте статей используют подписи из `src/i18n/media.json`. Изображения открываются крупнее по клику.
