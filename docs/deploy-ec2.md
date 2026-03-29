# Deploy Backend lên AWS EC2

**Instance**: c7i-flex.large (2 vCPU, 4GB RAM)
**OS**: Ubuntu 24.04 LTS
**Stack**: NestJS + PostgreSQL + Redis + Elasticsearch + RabbitMQ (all-in-one via Docker Compose)

---

## Mục lục

1. [Tạo EC2 Instance](#1-tạo-ec2-instance)
2. [Cấu hình Security Group](#2-cấu-hình-security-group)
3. [Kết nối SSH & cập nhật server](#3-kết-nối-ssh--cập-nhật-server)
4. [Cài đặt dependencies](#4-cài-đặt-dependencies)
5. [Cài đặt Docker & Docker Compose](#5-cài-đặt-docker--docker-compose)
6. [Clone repository](#6-clone-repository)
7. [Cấu hình Environment Variables](#7-cấu-hình-environment-variables)
8. [Khởi động services (Docker Compose)](#8-khởi-động-services-docker-compose)
9. [Build & chạy NestJS với PM2](#9-build--chạy-nestjs-với-pm2)
10. [Cài đặt Nginx làm reverse proxy](#10-cài-đặt-nginx-làm-reverse-proxy)
11. [Cấu hình SSL với Let's Encrypt](#11-cấu-hình-ssl-với-lets-encrypt)
12. [Cấu hình GitHub Actions CD](#12-cấu-hình-github-actions-cd)
13. [Maintenance & troubleshooting](#13-maintenance--troubleshooting)

---

## 1. Tạo EC2 Instance

1. Vào **AWS Console → EC2 → Launch Instance**
2. Chọn cấu hình:
   - **Name**: `ngonluon-api`
   - **AMI**: Ubuntu Server 24.04 LTS (HVM), SSD Volume Type
   - **Instance type**: `c7i-flex.large`
   - **Key pair**: Tạo mới hoặc dùng key có sẵn → lưu file `.pem`
   - **Storage**: 20 GB gp3 (tăng lên 30GB nếu cần cho Elasticsearch data)
3. Launch instance

---

## 2. Cấu hình Security Group

Trong tab **Security → Security Groups**, thêm **Inbound rules**:

| Type | Protocol | Port | Source | Mục đích |
|------|----------|------|--------|----------|
| SSH | TCP | 22 | My IP | SSH access |
| HTTP | TCP | 80 | 0.0.0.0/0 | HTTP (redirect sang HTTPS) |
| HTTPS | TCP | 443 | 0.0.0.0/0 | HTTPS — Vercel FE gọi vào |
| Custom TCP | TCP | 3001 | My IP | Tạm thời để test trực tiếp |

> **Lưu ý**: Sau khi setup Nginx xong, có thể xóa rule port 3001. Không expose các port nội bộ (5432, 6379, 9200, 5672, 15672) ra internet.

---

## 3. Kết nối SSH & cập nhật server

```bash
# Phân quyền key
chmod 400 ~/path/to/your-key.pem

# SSH vào server
ssh -i ~/path/to/your-key.pem ubuntu@<EC2_PUBLIC_IP>

# Cập nhật hệ thống
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential
```

---

## 4. Cài đặt dependencies

### Node.js 22 LTS (via nvm)

```bash
# Cài nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

# Reload shell
source ~/.bashrc

# Cài Node.js 22 LTS
nvm install 22
nvm use 22
nvm alias default 22

# Kiểm tra
node -v   # v22.x.x
npm -v
```

### pnpm

```bash
npm install -g pnpm
pnpm -v
```

### PM2

```bash
npm install -g pm2
pm2 -v
```

---

## 5. Cài đặt Docker & Docker Compose

```bash
# Cài Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Thêm user ubuntu vào group docker (không cần sudo khi chạy docker)
sudo usermod -aG docker ubuntu

# Logout rồi SSH lại để group có hiệu lực
exit
ssh -i ~/path/to/your-key.pem ubuntu@<EC2_PUBLIC_IP>

# Kiểm tra
docker --version
docker compose version
```

---

## 6. Clone repository

```bash
# Tạo thư mục app
mkdir -p /home/ubuntu/apps
cd /home/ubuntu/apps

# Clone repo
git clone https://github.com/<YOUR_USERNAME>/ngonluon.git
cd ngonluon
```

### Cấu hình Git credential (để CD tự git pull)

```bash
# Option 1: SSH deploy key (khuyến nghị)
ssh-keygen -t ed25519 -C "deploy@ec2" -f ~/.ssh/deploy_key -N ""
cat ~/.ssh/deploy_key.pub
# → Copy public key → GitHub repo → Settings → Deploy Keys → Add deploy key (Read-only)

# Cấu hình SSH dùng deploy key
cat >> ~/.ssh/config << 'EOF'
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/deploy_key
EOF

# Clone lại bằng SSH
cd /home/ubuntu/apps
rm -rf ngonluon
git clone git@github.com:<YOUR_USERNAME>/ngonluon.git
cd ngonluon
```

---

## 7. Cấu hình Environment Variables

```bash
cd /home/ubuntu/apps/ngonluon/api

# Copy từ example
cp .env.example .env

# Chỉnh sửa
nano .env
```

Nội dung `.env` cho production:

```env
NODE_ENV=production
PORT=3001

# Database — dùng localhost vì Docker expose port ra host
DATABASE_URL="postgresql://postgres:STRONG_PASSWORD_HERE@localhost:5432/ngonluon_prod"

# JWT — generate bằng: openssl rand -base64 64
JWT_SECRET=your_very_strong_jwt_secret_here
JWT_REFRESH_SECRET=your_very_strong_refresh_secret_here

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Elasticsearch
ELASTICSEARCH_URL=http://localhost:9200

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@localhost:5672

# Mail (Mailcatcher cho dev, SMTP thật cho prod)
MAIL_HOST=localhost
MAIL_PORT=1025
MAIL_USER=
MAIL_PASS=

# TMDB
TMDB_API_KEY=your_tmdb_api_key

# Stripe (nếu có)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# CORS — domain Vercel frontend
CORS_ORIGINS=https://your-app.vercel.app,https://yourdomain.com
```

> **Bảo mật**: File `.env` đã có trong `.gitignore`. Không commit lên git.

---

## 8. Khởi động services (Docker Compose)

Docker Compose đã có sẵn ở root project. Tạo file override để chỉ chạy các services cần thiết (bỏ Kibana, Mailcatcher trên production):

```bash
cd /home/ubuntu/apps/ngonluon
```

Tạo file `docker-compose.prod.yml`:

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  postgres:
    image: pgvector/pgvector:pg15
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: STRONG_PASSWORD_HERE  # khớp với DATABASE_URL
      POSTGRES_DB: ngonluon_prod
    ports:
      - "127.0.0.1:5432:5432"   # chỉ bind localhost, không expose ra ngoài
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:alpine
    restart: always
    ports:
      - "127.0.0.1:6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --save 60 1 --loglevel warning

  elasticsearch:
    image: elasticsearch:7.17.10
    restart: always
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"   # giới hạn heap cho c7i-flex.large
      - xpack.security.enabled=false
    ports:
      - "127.0.0.1:9200:9200"
    volumes:
      - es_data:/usr/share/elasticsearch/data
    ulimits:
      memlock:
        soft: -1
        hard: -1

  rabbitmq:
    image: rabbitmq:3-management-alpine
    restart: always
    ports:
      - "127.0.0.1:5672:5672"
      - "127.0.0.1:15672:15672"   # management UI — chỉ localhost
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq

volumes:
  postgres_data:
  redis_data:
  es_data:
  rabbitmq_data:
```

```bash
# Khởi động services
docker compose -f docker-compose.prod.yml up -d

# Kiểm tra trạng thái
docker compose -f docker-compose.prod.yml ps

# Xem logs
docker compose -f docker-compose.prod.yml logs -f elasticsearch
```

> **Lưu ý Elasticsearch**: Lần đầu khởi động có thể mất 1-2 phút. Kiểm tra: `curl http://localhost:9200`

---

## 9. Build & chạy NestJS với PM2

```bash
cd /home/ubuntu/apps/ngonluon/api

# Cài dependencies
pnpm install --frozen-lockfile

# Generate Prisma client
npx prisma generate

# Chạy migrations
npx prisma migrate deploy

# Build production
pnpm run build

# Khởi động với PM2
pm2 start dist/main.js \
  --name ngonluon-api \
  --max-memory-restart 512M \
  --log /home/ubuntu/apps/ngonluon/api/logs/pm2.log

# Lưu config PM2 để tự restart khi server reboot
pm2 save
pm2 startup
# → Copy và chạy lệnh mà PM2 in ra (dạng: sudo env PATH=... pm2 startup systemd ...)
```

### Kiểm tra

```bash
# Xem logs realtime
pm2 logs ngonluon-api

# Trạng thái
pm2 status

# Test API
curl http://localhost:3001/api
```

---

## 10. Cài đặt Nginx làm reverse proxy

```bash
sudo apt install -y nginx

# Tạo config
sudo nano /etc/nginx/sites-available/ngonluon-api
```

Nội dung file config:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;   # thay bằng domain thật

    # Logs
    access_log /var/log/nginx/ngonluon-api.access.log;
    error_log  /var/log/nginx/ngonluon-api.error.log;

    # Upload limit (cho movie uploads)
    client_max_body_size 100M;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;

        # Headers cần thiết
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_cache_bypass $http_upgrade;

        # Timeout cho long-running requests
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/ngonluon-api /etc/nginx/sites-enabled/

# Kiểm tra config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## 11. Cấu hình SSL với Let's Encrypt

> **Yêu cầu**: Phải có domain trỏ A record vào IP EC2 trước khi chạy bước này.

### Trỏ DNS (trên Cloudflare/Namecheap)

```
A record: api.yourdomain.com → <EC2_PUBLIC_IP>
```

Chờ DNS propagate (vài phút đến 1 tiếng), kiểm tra: `nslookup api.yourdomain.com`

### Cài Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx

# Lấy certificate
sudo certbot --nginx -d api.yourdomain.com

# Làm theo hướng dẫn:
# - Nhập email
# - Agree to TOS: Y
# - Share email with EFF: N
# - Redirect HTTP to HTTPS: 2 (Yes)

# Kiểm tra auto-renewal
sudo certbot renew --dry-run
```

Sau khi chạy xong, Certbot tự cập nhật `/etc/nginx/sites-available/ngonluon-api` với SSL config.

### Kiểm tra

```bash
curl https://api.yourdomain.com/api
# → Swagger JSON response
```

---

## 12. Cấu hình GitHub Actions CD

### Secrets cần thêm vào GitHub

Vào **GitHub repo → Settings → Secrets and variables → Actions → New repository secret**:

| Secret Name | Giá trị | Cách lấy |
|-------------|---------|----------|
| `EC2_HOST` | `api.yourdomain.com` | Domain EC2 |
| `EC2_USER` | `ubuntu` | Default Ubuntu user |
| `EC2_SSH_KEY` | Nội dung file `.pem` | `cat your-key.pem` |
| `VERCEL_TOKEN` | Token từ Vercel | vercel.com → Settings → Tokens |
| `VERCEL_ORG_ID` | Org ID | `cat web/.vercel/project.json` |
| `VERCEL_PROJECT_ID` | Project ID | `cat web/.vercel/project.json` |

### Copy nội dung SSH key

```bash
# Trên máy local — copy toàn bộ nội dung (bao gồm -----BEGIN/END-----)
cat ~/path/to/your-key.pem
```

### File `.github/workflows/cd.yml`

Xem file `cd.yml` trong `.github/workflows/` — đảm bảo script deploy khớp với đường dẫn:

```yaml
script: |
  cd /home/ubuntu/apps/ngonluon/api
  git pull origin main
  pnpm install --frozen-lockfile
  npx prisma migrate deploy
  pnpm run build
  pm2 restart ngonluon-api
```

### Test CD thủ công

```bash
# Trên EC2 — chạy thử script deploy
cd /home/ubuntu/apps/ngonluon/api
git pull origin main
pnpm install --frozen-lockfile
npx prisma migrate deploy
pnpm run build
pm2 restart ngonluon-api
pm2 status
```

---

## 13. Maintenance & troubleshooting

### PM2 commands

```bash
pm2 status                    # Trạng thái tất cả processes
pm2 logs ngonluon-api         # Xem logs realtime
pm2 logs ngonluon-api --lines 100  # 100 dòng gần nhất
pm2 restart ngonluon-api      # Restart app
pm2 stop ngonluon-api         # Stop
pm2 monit                     # Dashboard realtime (CPU/RAM)
```

### Docker Compose commands

```bash
cd /home/ubuntu/apps/ngonluon

# Xem trạng thái services
docker compose -f docker-compose.prod.yml ps

# Xem logs một service
docker compose -f docker-compose.prod.yml logs -f postgres
docker compose -f docker-compose.prod.yml logs -f elasticsearch

# Restart một service
docker compose -f docker-compose.prod.yml restart redis

# Dừng tất cả
docker compose -f docker-compose.prod.yml down

# Khởi động lại tất cả
docker compose -f docker-compose.prod.yml up -d
```

### Kiểm tra RAM usage

```bash
free -h
docker stats --no-stream     # RAM từng container
pm2 monit                    # RAM NestJS process
```

### Prisma commands

```bash
cd /home/ubuntu/apps/ngonluon/api

# Xem migration status
npx prisma migrate status

# Chạy migrations mới
npx prisma migrate deploy

# Mở Prisma Studio (chỉ dùng khi cần debug, tunnel SSH)
npx prisma studio --port 5555
# → SSH tunnel: ssh -L 5555:localhost:5555 ubuntu@api.yourdomain.com
```

### Nginx commands

```bash
sudo nginx -t                   # Kiểm tra config
sudo systemctl reload nginx     # Reload config (không restart)
sudo systemctl restart nginx    # Restart
sudo tail -f /var/log/nginx/ngonluon-api.error.log  # Error logs
```

### Xem disk usage

```bash
df -h                           # Disk tổng
du -sh /var/lib/docker/volumes/ # Docker volumes
```

### Tự động khởi động khi reboot

```bash
# Kiểm tra PM2 startup đã được cấu hình chưa
pm2 list

# Docker Compose tự restart vì đã có restart: always trong config

# Kiểm tra Nginx tự start
sudo systemctl is-enabled nginx   # → enabled
```

---

## Checklist deploy lần đầu

- [ ] EC2 instance tạo và đang chạy
- [ ] Security group đã cấu hình đúng ports
- [ ] SSH kết nối được
- [ ] Node.js 22 + pnpm + PM2 đã cài
- [ ] Docker + Docker Compose đã cài
- [ ] Repository đã clone
- [ ] File `.env` đã cấu hình với đúng values
- [ ] `docker-compose.prod.yml` đã tạo
- [ ] Docker services đang chạy (postgres, redis, elasticsearch, rabbitmq)
- [ ] Elasticsearch health check OK: `curl localhost:9200/_cluster/health`
- [ ] `pnpm install` thành công
- [ ] `prisma generate` thành công
- [ ] `prisma migrate deploy` thành công
- [ ] `pnpm run build` thành công
- [ ] PM2 đang chạy và app healthy: `curl localhost:3001/api`
- [ ] Nginx đã cài và config đúng
- [ ] DNS A record đã trỏ vào EC2 IP
- [ ] SSL certificate đã lấy (certbot)
- [ ] HTTPS hoạt động: `curl https://api.yourdomain.com/api`
- [ ] GitHub Secrets đã thêm đủ
- [ ] CD workflow test thành công (push 1 commit nhỏ lên main)
- [ ] Vercel FE đã cập nhật `NEXT_PUBLIC_API_URL=https://api.yourdomain.com`
