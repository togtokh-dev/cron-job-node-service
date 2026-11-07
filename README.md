# cron-job-service

Хуваарьт HTTP ажлуудыг (scheduled jobs) удирдах **өөрөө host хийх (self-hosted)** Node.js сервис.
Доторроо [node-cron](https://www.npmjs.com/package/node-cron) scheduler, MongoDB хадгалалт,
JWT-тэй admin panel (React), Swagger баримтжуулалт, болон хуучин
[`cron-job-node`](https://github.com/togtokh-dev/cron-job-node) SDK-тэй бүрэн нийцтэй public API-тай.

> A self-hostable service to schedule and run HTTP jobs. Clone it, run it, and drive your jobs
> either from the built-in admin panel or programmatically with the `cron-job-node` npm SDK.

---

## Юунд зориулагдсан бэ?

- ⏱ **Хуваарьт HTTP дуудлага** — тодорхой cron хуваарьтайгаар дурын URL руу request илгээх
- 🗂 **Admin panel** — ажил нэмэх/засах/унтраах, log үзэх, API key, тохиргоо (`/` дээр)
- 🔑 **API key** — программаар удирдах хандалт (сонголт)
- 🧾 **Гүйцэтгэлийн log** — ажил бүрийн амжилт/алдааг хадгалах + авто цэвэрлэгээ
- 📦 **SDK-ээр удирдах** — `cron-job-node` package-аар кодоосоо ажлаа бүртгэх
- 🔁 **Backward-compatible** — хуучин `/cron-job/v1` API хэвээр

---

## 1. Суулгах / Clone & install

```bash
git clone https://github.com/togtokh-dev/cron-job-node-service.git
cd cron-job-node-service
npm install
```

Node.js **>= 20** болон ажиллаж буй **MongoDB** хэрэгтэй (локал эсвэл Atlas).

---

## 2. Тохиргоо / Configure

`.env.example`-г хуулж орчиндоо тохируул:

```bash
cp .env.example .env.development
```

Доод хэдэн утгыг **заавал** бөгл:

| Хувьсагч | Тайлбар |
|----------|---------|
| `MONGODB_URI` | MongoDB холболт, ж: `mongodb://localhost:27017/` |
| `JWT_SECRET` | Panel-ийн token нууц түлхүүр (`openssl rand -hex 32`) |
| `ADMIN_USERNAME` | Admin нэвтрэх нэр (default `admin`) |
| `ADMIN_PASSWORD` **эсвэл** `ADMIN_PASSWORD_HASH` | Admin нууц үг. prod дээр hash санал болгоно |

Admin нууц үгийн bcrypt hash үүсгэх:

```bash
node -e "console.log(require('bcryptjs').hashSync('ТАНЫ_НУУЦҮГ', 10))"
```

> ⚠️ `.env.*` файлууд энэ repo-д **хоосон template**-ээр орсон. Нууц утгуудаа локалдаа бөгл,
> нийтийн repo руу бүү commit хий. prod/staging дээр `JWT_SECRET`, `ADMIN_PASSWORD(_HASH)`,
> `SWAGGER_PASSWORD` хоосон бол сервер эхлэхгүй (зориуд хамгаалалт).

---

## 3. Ажиллуулах / Run

```bash
# Development (hot reload)
npm run dev

# Production
npm run build
npm start
```

Сервер өгөгдмөлөөр `http://localhost:2003` дээр:

| Зам | Юу вэ |
|-----|-------|
| `/` | Admin panel (React) |
| `/docs` | Swagger / OpenAPI баримт |
| `/healthcheck` | Liveness probe |
| `/cron-job/v1` | Нийтийн cron API (SDK үүнийг дууддаг) |

### Docker

```bash
docker build -t cron-job-service .
docker run -p 2003:2003 --env-file .env.production cron-job-service
```

---

## 4. Ажлаа удирдах

### A) Admin panel-аар

`http://localhost:2003/` руу орж `ADMIN_USERNAME` / нууц үгээрээ нэвтэрч ажил нэмэх, cron
хуваарь тавих, log үзэх, тохиргоо хийх.

### B) `cron-job-node` SDK-аар (кодоос)

Өөр project-оосоо ажлаа программаар бүртгэх хамгийн хялбар арга:

```bash
npm install cron-job-node
```

```ts
import cronJobNode, { setHost, setApiKey, CronJobNodeData } from "cron-job-node";

setHost("http://localhost:2003"); // өөрийн service-ийн хаяг
// setApiKey("cj_xxx"); // API key ашиглаж байгаа бол

const list: CronJobNodeData = [
  {
    id: "my-token-refresh",
    config: {
      method: "get",
      url: "https://api.example.com/v1/get-token",
      headers: {}
    },
    job_time: "* * * * *",     // cron: минут тутам
    status: true,              // идэвхтэй эсэх
    type_name: "dev",          // prod | staging | test | dev
    log_enabled: true          // гүйцэтгэлийн log (сонголт)
  }
];

await cronJobNode(list); // → /cron-job/v1/list руу upsert хийнэ
```

SDK нь дотроо `POST {host}/cron-job/v1/list` руу илгээж, `id`-гаар upsert (нэмэх/шинэчлэх) хийдэг.
Дэлгэрэнгүйг [cron-job-node README](https://github.com/togtokh-dev/cron-job-node)-оос үз.

---

## Орчин / Environments

`SERVER` (`dev` | `staging` | `prod` | `test`) болон холбогдох `.env.<orchin>` файлаар
орчноо ялгана. `npm run dev` → development, `npm start` → production.

---

## Техник

Express 4 · Mongoose 8 · node-cron · Joi · JWT · Swagger · React + Vite admin panel.
Ажил/log/тохиргоо MongoDB-д хадгалагдах тул schema migration шаардлагагүй.

---

## Лиценз

[ISC](./LICENSE) — TOGTOKH.DEV
