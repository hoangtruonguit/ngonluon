# Deploy Frontend lên Vercel

**Framework**: Next.js 16 (App Router)
**Domain**: phimtot.online (www) hoặc app.phimtot.online
**API**: https://api.phimtot.online

---

## Mục lục

1. [Cài Vercel CLI & đăng nhập](#1-cài-vercel-cli--đăng-nhập)
2. [Link project với Vercel](#2-link-project-với-vercel)
3. [Cấu hình Environment Variables](#3-cấu-hình-environment-variables)
4. [Fix next.config.ts cho production](#4-fix-nextconfigts-cho-production)
5. [Deploy lần đầu](#5-deploy-lần-đầu)
6. [Cấu hình custom domain](#6-cấu-hình-custom-domain)
7. [Cấu hình GitHub auto-deploy](#7-cấu-hình-github-auto-deploy)
8. [Cấu hình GitHub Actions CD](#8-cấu-hình-github-actions-cd)
9. [Kiểm tra sau deploy](#9-kiểm-tra-sau-deploy)
10. [Maintenance](#10-maintenance)

---

## 1. Cài Vercel CLI & đăng nhập

```bash
# Cài global
npm i -g vercel

# Đăng nhập (mở browser)
vercel login
# → Chọn "Continue with GitHub" hoặc email
```

---

## 2. Link project với Vercel

```bash
cd /path/to/ngonluon/web

vercel link
```

Trả lời các câu hỏi:

```
? Set up "~/Projects/ngonluon/web"? → Y
? Which scope? → chọn account của bạn
? Link to existing project? → N (tạo mới)
? What's your project's name? → ngonluon-web   (hoặc phimtot)
? In which directory is your code located? → ./
```

Vercel sẽ tạo thư mục `.vercel/` trong `web/` với file `project.json`:

```json
{
  "orgId": "YOUR_ORG_ID",
  "projectId": "YOUR_PROJECT_ID"
}
```

> **Quan trọng**: Thêm `.vercel` vào `.gitignore` của thư mục `web/` nếu chưa có.

---

## 3. Cấu hình Environment Variables

### Pull settings về local (nếu cần)

```bash
vercel env pull web/.env.local
```

### Thêm env vars cho production

```bash
# Cách 1: Dùng CLI
vercel env add NEXT_PUBLIC_API_URL production
# → nhập value: https://api.phimtot.online

# Cách 2: Dùng Dashboard (dễ hơn)
# vercel.com → project → Settings → Environment Variables
```

### Danh sách env vars cần set

| Variable | Value | Environment |
|----------|-------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://api.phimtot.online` | Production, Preview |

> **Lưu ý**: Dự án này chỉ cần 1 env var vì FE chỉ gọi API qua `NEXT_PUBLIC_API_URL`. Nếu sau này thêm analytics, auth third-party... thì bổ sung thêm.

### Set qua Dashboard (khuyến nghị cho production)

1. https://vercel.com → chọn project `ngonluon-web`
2. **Settings → Environment Variables**
3. **Add New**:
   - Key: `NEXT_PUBLIC_API_URL`
   - Value: `https://api.phimtot.online`
   - Environment: ✅ Production, ✅ Preview, ✅ Development

---

## 4. Fix next.config.ts cho production

Hiện tại `next.config.ts` đang có `localhost:3001` cho avatars — cần thêm domain production:

```typescript
// web/next.config.ts
images: {
  remotePatterns: [
    // ... các entries hiện có ...
    {
      protocol: 'http',
      hostname: 'localhost',
      port: '3001',
      pathname: '/uploads/avatars/**',
    },
    // Thêm dòng này cho production
    {
      protocol: 'https',
      hostname: 'api.phimtot.online',
      pathname: '/uploads/avatars/**',
    },
  ],
},
```

---

## 5. Deploy lần đầu

```bash
cd /path/to/ngonluon/web

# Preview deploy (test trước)
vercel

# Production deploy
vercel --prod
```

Output sẽ trông như này:

```
✓ Deployed to production. Run `vercel --prod` to overwrite later.
➜  Production: https://ngonluon-web.vercel.app
```

### Kiểm tra build log nếu fail

```bash
vercel logs <deployment-url>

# Hoặc xem trên dashboard
# vercel.com → project → Deployments → click deployment → View Build Logs
```

### Các lỗi thường gặp khi build

**Lỗi 1: peer dependency**
```bash
# web/ dùng npm với --legacy-peer-deps
# Cần cấu hình Vercel dùng flag này
```

Vào **Vercel Dashboard → project → Settings → General → Install Command**:
```
npm install --legacy-peer-deps
```

**Lỗi 2: Build command**

Settings → **Build Command**: `npm run build`

**Lỗi 3: Root directory**

Settings → **Root Directory**: `web`

> Quan trọng vì repo là monorepo (có cả `api/` và `web/`), Vercel cần biết build từ thư mục nào.

---

## 6. Cấu hình custom domain

### Mục tiêu

```
phimtot.online       → Next.js FE trên Vercel
www.phimtot.online   → Redirect về phimtot.online
api.phimtot.online   → NestJS BE trên EC2 (đã setup)
```

### Bước 6.1 — Thêm domain vào Vercel

1. **Vercel Dashboard → project → Settings → Domains**
2. **Add Domain** → nhập `phimtot.online`
3. Vercel sẽ hiện DNS instructions

### Bước 6.2 — Cấu hình DNS trên Namecheap

Vào **Namecheap → phimtot.online → Advanced DNS → Host Records**:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| **A Record** | `@` | `76.76.21.21` | Automatic |
| **CNAME Record** | `www` | `cname.vercel-dns.com.` | Automatic |

> IP `76.76.21.21` là Vercel's IP. Vercel sẽ confirm đúng IP này khi bạn add domain.

### Bước 6.3 — Chờ và verify

```bash
# Kiểm tra propagate (5-30 phút)
nslookup phimtot.online
# → phải trả về 76.76.21.21

# Test HTTPS
curl -I https://phimtot.online
# → HTTP/2 200
```

Vercel tự động cấp SSL cho custom domain — không cần certbot.

---

## 7. Cấu hình GitHub auto-deploy

### Kết nối GitHub repo với Vercel (nếu chưa)

1. **Vercel Dashboard → project → Settings → Git**
2. **Connect Git Repository** → chọn GitHub → chọn repo `ngonluon`
3. **Production Branch**: `main`

### Cấu hình cho monorepo

Vì repo chứa cả `api/` và `web/`, cần cấu hình Vercel chỉ build khi có thay đổi trong `web/`:

**Settings → Git → Ignored Build Step**:

```bash
git diff HEAD^ HEAD --quiet -- web/
```

Lệnh này: nếu không có file nào trong `web/` thay đổi → exit code 0 → Vercel skip build.

---

## 8. Cấu hình GitHub Actions CD

Lấy các giá trị cần thiết:

```bash
# Vercel Token
# → vercel.com → Settings (account) → Tokens → Create token
# → Name: "github-actions-cd", Scope: Full Account

# Org ID và Project ID
cat web/.vercel/project.json
# {
#   "orgId": "team_xxxxxxxxxxxx",
#   "projectId": "prj_xxxxxxxxxxxx"
# }
```

### Thêm vào GitHub Secrets

**GitHub repo → Settings → Secrets and variables → Actions**:

| Secret | Value |
|--------|-------|
| `VERCEL_TOKEN` | Token vừa tạo trên Vercel |
| `VERCEL_ORG_ID` | `orgId` từ `project.json` |
| `VERCEL_PROJECT_ID` | `projectId` từ `project.json` |

### File `.github/workflows/cd.yml`

```yaml
name: CD

on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    name: Deploy Frontend to Vercel
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./web
          vercel-args: '--prod'

  deploy-backend:
    name: Deploy Backend to EC2
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to EC2 via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ${{ secrets.EC2_USER }}
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            cd /home/ubuntu/apps/ngonluon/api
            git pull origin main
            pnpm install --frozen-lockfile
            npx prisma migrate deploy
            pnpm run build
            pm2 restart ngonluon-api
```

---

## 9. Kiểm tra sau deploy

### Checklist

```bash
# 1. Homepage load được
curl -I https://phimtot.online
# → HTTP/2 200

# 2. API calls hoạt động (không bị CORS)
curl -I https://api.phimtot.online/api
# → HTTP/2 200

# 3. Kiểm tra CORS header từ API
curl -H "Origin: https://phimtot.online" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://api.phimtot.online/api \
     -v 2>&1 | grep -i "access-control"
# → Phải thấy: access-control-allow-origin: https://phimtot.online
```

### Nếu bị CORS error

Vào EC2, cập nhật `.env`:

```env
CORS_ORIGINS=https://phimtot.online,https://www.phimtot.online
```

Và đảm bảo NestJS `main.ts` đọc đúng:

```typescript
app.enableCors({
  origin: process.env.CORS_ORIGINS?.split(',') ?? ['http://localhost:3000'],
  credentials: true,
});
```

Sau đó restart:
```bash
pm2 restart ngonluon-api
```

### Kiểm tra images từ API

Nếu avatar/upload images bị lỗi 400 trên Vercel → check lại `next.config.ts` đã thêm `api.phimtot.online` vào `remotePatterns` chưa (xem bước 4).

---

## 10. Maintenance

### Xem deployment logs

```bash
# CLI
vercel logs https://phimtot.online

# Hoặc dashboard
# vercel.com → project → Deployments → chọn deployment
```

### Rollback deployment

```bash
# Xem danh sách deployments
vercel ls

# Promote deployment cũ lên production
vercel promote <deployment-url>
```

### Xem realtime function logs

```bash
vercel logs --follow https://phimtot.online
```

### Redeploy không cần push code

```bash
cd web/
vercel --prod
```

### Kiểm tra env vars đang active

```bash
vercel env ls
```

---

## Checklist deploy lần đầu

- [ ] Vercel CLI đã cài (`npm i -g vercel`)
- [ ] Đã `vercel login`
- [ ] Đã `vercel link` trong thư mục `web/`
- [ ] Env var `NEXT_PUBLIC_API_URL=https://api.phimtot.online` đã set trên Vercel
- [ ] `next.config.ts` đã thêm `api.phimtot.online` vào `remotePatterns`
- [ ] **Root Directory** trong Vercel Settings set là `web`
- [ ] **Install Command** set là `npm install --legacy-peer-deps`
- [ ] Build thành công: `vercel --prod`
- [ ] DNS A record `@` → `76.76.21.21` đã thêm trên Namecheap
- [ ] DNS CNAME `www` → `cname.vercel-dns.com.` đã thêm trên Namecheap
- [ ] `phimtot.online` đã resolve đúng
- [ ] HTTPS hoạt động trên domain
- [ ] CORS không bị lỗi khi FE gọi API
- [ ] Images từ TMDB và API load được
- [ ] GitHub repo đã connect với Vercel
- [ ] Ignored Build Step đã config (tránh build thừa)
- [ ] GitHub Secrets đã thêm đủ 3 Vercel secrets
- [ ] CD workflow test thành công
