# GitHub Pages и kaif-life.com

Сайт собирается статически через `.github/workflows/deploy.yml`.
В настройках Astro указан `https://kaif-life.com`, пути рассчитаны на корень собственного домена.

## GitHub

1. Открыть https://github.com/Ladya2003/kaif-life-site/settings/pages
2. В Build and deployment → Source выбрать GitHub Actions.
3. В Custom domain указать `kaif-life.com` и сохранить.
4. После настройки DNS открыть Actions → Deploy KAIF LIFE to GitHub Pages → Run workflow → main.
5. Дождаться успешных build и deploy. Если запуск от первого push завершился раньше включения Pages, запустить workflow ещё раз.
6. После проверки домена и выдачи сертификата включить Enforce HTTPS.

Для custom GitHub Actions файл CNAME не заменяет настройку Custom domain в интерфейсе GitHub.
Существующий `public/CNAME` можно оставить.

## Cloudflare DNS

Открыть домен kaif-life.com → DNS → Records. Сначала сохранить Custom domain в GitHub, затем настраивать DNS.

| Тип | Name | Content | Proxy status | TTL |
| --- | --- | --- | --- | --- |
| A | @ | 185.199.108.153 | DNS only | Auto |
| A | @ | 185.199.109.153 | DNS only | Auto |
| A | @ | 185.199.110.153 | DNS only | Auto |
| A | @ | 185.199.111.153 | DNS only | Auto |
| CNAME | www | Ladya2003.github.io | DNS only | Auto |

`DNS only` — серое облако. В этом режиме посетители подключаются к GitHub Pages напрямую; Cloudflare обслуживает DNS.
В CNAME для www указывается только Ladya2003.github.io, без протокола и пути репозитория.
Конфликтующие старые A/AAAA/CNAME для @ или www нужно заменить этими значениями. Почтовые MX/TXT и другие независимые записи сохраняются.
Nameserver домена остаётся в Cloudflare.

Распространение DNS и доступность Enforce HTTPS могут занять до 24 часов.

## Проверка после запуска

Открыть `https://kaif-life.com`, `/en/`, `/es/`, `/stories/` и `/sitemap.xml`.
Затем добавить sitemap в Google Search Console, как описано в SEO.md.
После настройки новые push в main будут публиковаться автоматически.

## Источники

- https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
- https://developers.cloudflare.com/dns/proxy-status/

Инструкция проверена 28 октября 2026. Настройки GitHub Pages и Cloudflare пользователю предстоит выполнить в интерфейсе.
