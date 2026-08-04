# ESC-Backend: перевод загрузок Strapi на S3 (Selectel) — ТОЛЬКО изменения в коде

Контекст: медиа Strapi переводим с локального диска на объектное хранилище Selectel S3 (бакет `esc-media`).
**Env-переменные (`S3_*`) уже прописаны в Dokploy — трогать их не нужно.** Данные (перенос существующих файлов) делает другая сторона. Твоя задача — **только 3 изменения в коде** в ветке `deploy/dokploy`, затем commit + push (сработает автодеплой).

## 1. Установить провайдер
```bash
npm i @strapi/provider-upload-aws-s3
```
Закоммитить обновлённые `package.json` и `package-lock.json`.

## 2. `config/plugins.ts` — заменить содержимое на:
```ts
import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Plugin => ({
  upload: {
    config: {
      provider: 'aws-s3',
      providerOptions: {
        baseUrl: env('S3_BASE_URL'),
        s3Options: {
          endpoint: env('S3_ENDPOINT'),
          region: env('S3_REGION', 'ru-1'),
          forcePathStyle: env.bool('S3_FORCE_PATH_STYLE', true),
          credentials: {
            accessKeyId: env('S3_ACCESS_KEY_ID'),
            secretAccessKey: env('S3_SECRET_ACCESS_KEY'),
          },
          params: { Bucket: env('S3_BUCKET') },
        },
      },
      actionOptions: { upload: {}, uploadStream: {}, delete: {} },
    },
  },
});

export default config;
```
Примечание: per-object ACL НЕ передаём (Selectel его не поддерживает; публичность включена на контейнере).

## 3. `config/middlewares.ts` — разрешить хост S3 в CSP
Заменить строку `'strapi::security'` на объект (иначе админка/превью заблокируют картинки с внешнего домена):
```ts
{
  name: 'strapi::security',
  config: {
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'connect-src': ["'self'", 'https:'],
        'img-src': ["'self'", 'data:', 'blob:', '36319d83-9544-413a-8f1d-8e1b634e14f8.selstorage.ru'],
        'media-src': ["'self'", 'data:', 'blob:', '36319d83-9544-413a-8f1d-8e1b634e14f8.selstorage.ru'],
        upgradeInsecureRequests: null,
      },
    },
  },
},
```
Остальные middleware в массиве оставить как есть.

## 4. Деплой и проверка
1. `git commit` + `git push` в `deploy/dokploy` → автодеплой (или Redeploy в Dokploy).
2. В админке Strapi загрузить любую картинку → её `url` должен указывать на `https://36319d83-...selstorage.ru/...` и открываться (200).

Если что-то не так — сборка/переменные проверяются на стороне инфраструктуры; код выше самодостаточен.

---
После этого деплоя новые загрузки идут в S3. Перенос уже существующих ~24k файлов и до-заливку фото сделает отдельно вторая сторона — тебе делать ничего не нужно.
