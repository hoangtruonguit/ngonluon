# Plan: Payment/Subscription System

## Context

NgonLuon da co san `Subscription` model (Prisma), `Movie.isVip` flag (dung de danh dau phim premium), va `sendSubscriptionEmail()`. Nhung chua co payment gateway, chua co content gating, chua co checkout flow.

Feature nay se:
- Tich hop Stripe de xu ly thanh toan subscription
- Dung subscription status lam **single source of truth** de gate premium content
- **Bo khai niem VIP Role** — chi dung Subscription record de xac dinh quyen truy cap premium

### Tai sao bo VIP Role?
- Tranh nham nhang giua 2 co che (role vs subscription) cho cung 1 muc dich
- Single source of truth: subscription status quyet dinh tat ca
- Khong can sync role ↔ subscription, giam complexity
- Admin van co the "tang premium" bang cach tao complimentary subscription (khong qua Stripe)

### Mo hinh subscription (Netflix-style)
- **Moi subscriber (Basic hoac Premium) deu xem duoc tat ca content**
- `Movie.isPremium` = "can bat ky subscription nao de xem" (khong phan tier content)
- Su khac biet giua Basic vs Premium nam o **chat luong va tinh nang**, khong phai noi dung:

| Feature | Free | Basic ($4.99/mo) | Premium ($9.99/mo) |
|---------|------|-------------------|---------------------|
| Xem phim free | ✓ | ✓ | ✓ |
| Xem phim premium | ✗ | ✓ | ✓ |
| Chat luong | SD | HD | 4K |
| Quang cao | Co | Khong | Khong |
| Download offline | ✗ | ✗ | ✓ |
| Xem dong thoi | 1 | 2 | 4 |

### Thay doi terminology
| Cu | Moi |
|----|-----|
| VIP Role | *(bo)* |
| `Movie.isVip` | `Movie.isPremium` (rename) |
| VipGuard | `SubscriptionGuard` |
| "VIP member" | "Subscriber" |

---

## Phase 0: Cleanup — Bo VIP Role

### 0a. Prisma Schema (`api/prisma/schema.prisma`)
- Xoa `VIP` khoi `RoleName` enum → chi con `ADMIN`, `USER`
- Rename `Movie.isVip` → `Movie.isPremium` (+ migration)

### 0b. Migration
```bash
npx prisma migrate dev --name remove-vip-rename-premium
```

### 0c. Backend cleanup
- Xoa tat ca VIP role assignments trong seed scripts
- Update `RoleEditModal` — chi con ADMIN/USER
- Update admin user management — bo VIP option
- Update movie mapper/response — `isVip` → `isPremium`
- Update movie detail page frontend — rename VIP badge → Premium badge

### 0d. Frontend cleanup
- Update movie cards, movie detail page: `isVip` → `isPremium`
- Update admin role filter: bo VIP option
- Update i18n keys

---

## Phase 1: Database + Stripe Setup

### 1a. Extend Prisma Schema (`api/prisma/schema.prisma`)

**User** — them field:
```
stripeCustomerId  String?  @unique @map("stripe_customer_id")
```

**Subscription** — them fields:
```
stripeCustomerId     String?  @map("stripe_customer_id")
stripeSubscriptionId String?  @unique @map("stripe_subscription_id")
stripePriceId        String?  @map("stripe_price_id")
cancelledAt          DateTime? @map("cancelled_at")
```

### 1b. Migration
```bash
npx prisma migrate dev --name add-stripe-fields
```

### 1c. Install
```bash
cd api && pnpm add stripe @nestjs/schedule
```

### 1d. Environment Variables (`api/.env`)
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_BASIC=price_...
STRIPE_PRICE_PREMIUM=price_...
```

### 1e. Stripe Dashboard (manual)
- Tao 2 Products trong Test Mode: Basic ($4.99/mo), Premium ($9.99/mo)
- Ghi lai `price_` IDs vao `.env`

---

## Phase 2: Backend Subscription Module

Tao module moi `api/src/subscriptions/` theo pattern hien tai (repository → service → controller).

### Files moi:
```
api/src/subscriptions/
  subscriptions.module.ts
  subscriptions.controller.ts
  subscriptions.service.ts
  subscriptions.repository.ts
  subscriptions.cron.ts
  interfaces/subscription.interfaces.ts
  dto/create-checkout.dto.ts
```

### Repository Methods
| Method | Description |
|--------|-------------|
| `findActiveByUserId(userId)` | Tim subscription ACTIVE + endDate > now |
| `findByStripeSubscriptionId(stripeSubId)` | Tim theo Stripe ID |
| `findHistoryByUserId(userId)` | Tat ca subscriptions cua user |
| `create(data)` / `update(id, data)` | CRUD |

### Service Methods
| Method | Logic |
|--------|-------|
| `getPlans()` | Return plan configs (name, price, features) — static data |
| `createCheckoutSession(userId, planName)` | Lookup/create Stripe Customer → `stripe.checkout.sessions.create({ mode: 'subscription' })` → return URL |
| `handleWebhook(payload, signature)` | Verify → dispatch theo event.type |
| `getMySubscription(userId)` | Cache Redis 5 min, return active subscription or null |
| `hasActiveSubscription(userId)` | Boolean check, cache Redis 5 min — dung cho SubscriptionGuard |
| `cancelSubscription(userId)` | `stripe.subscriptions.update(id, { cancel_at_period_end: true })` |

### Webhook Events
| Event | Action |
|-------|--------|
| `checkout.session.completed` | Create Subscription record, invalidate cache, send email |
| `invoice.payment_succeeded` | Update endDate, set ACTIVE |
| `customer.subscription.updated` | Handle plan change / cancellation schedule |
| `customer.subscription.deleted` | Set CANCELLED, invalidate cache, send email |
| `invoice.payment_failed` | Log warning, send email |

**Idempotency**: Check Stripe event ID trong Redis (TTL 24h) truoc khi xu ly.

### Controller Endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/subscriptions/plans` | Public | Danh sach plans + gia |
| POST | `/subscriptions/checkout` | JwtAuth | Tao Stripe Checkout Session → `{ url }` |
| GET | `/subscriptions/me` | JwtAuth | Subscription hien tai cua user |
| POST | `/subscriptions/cancel` | JwtAuth | Huy subscription (end of period) |
| POST | `/subscriptions/webhook` | None | Stripe webhook (raw body!) |

**Luu y**: Webhook endpoint can raw body. Config trong `main.ts`:
```typescript
app.useGlobalPipes(new ValidationPipe());
// Raw body cho webhook route
const rawBodyBuffer = (req, res, buf) => { req.rawBody = buf; };
app.use('/subscriptions/webhook', bodyParser.raw({ type: 'application/json', verify: rawBodyBuffer }));
```

### Cron Job (`subscriptions.cron.ts`)
```typescript
@Cron('0 */6 * * *')  // Moi 6 tieng
async handleExpiredSubscriptions()
  // Tim subscriptions: endDate < now() AND status = ACTIVE
  // Update → EXPIRED, invalidate cache, send email
```

### Module Registration
```typescript
// subscriptions.module.ts
@Module({
  imports: [PrismaModule, ScheduleModule.forRoot()],
  providers: [SubscriptionsRepository, SubscriptionsService, SubscriptionsCron],
  controllers: [SubscriptionsController],
  exports: [SubscriptionsService],
})

// app.module.ts — them SubscriptionsModule vao imports
```

---

## Phase 3: Premium Content Gating (Backend)

### 3a. SubscriptionGuard (`api/src/common/guards/subscription.guard.ts`)
- Extract `slug` tu request params
- Lookup movie, check `isPremium`
- Neu `isPremium === false` → cho qua (ai cung xem duoc)
- Neu `isPremium === true` → check `subscriptionsService.hasActiveSubscription(userId)`
- **Bat ky plan nao (Basic hoac Premium) deu pass** — guard chi check co subscription hay khong, khong check plan tier
- Khong co subscription → throw `ForbiddenException('Subscription required to watch this content')`

### 3b. Apply SubscriptionGuard
- Endpoint `GET /movies/:slug/watch-access` moi — tra ve `{ canWatch, requiresSubscription }`
- Apply len watch-history endpoints cho premium movies

### 3c. Modify Movie Response
- Them field `requiresSubscription: boolean` vao movie detail response (= `isPremium`)
- Frontend dung field nay de show lock UI ma khong can goi them API

### 3d. Admin: Complimentary Subscription
- Them endpoint `POST /admin/users/:id/grant-subscription` trong admin-users controller
- Tao Subscription record voi `planName: 'Complimentary'`, khong co Stripe IDs
- Day la cach admin "tang premium" thay vi gan VIP role

---

## Phase 4: Frontend — Pricing Page + Checkout

### 4a. Subscription Service (`web/src/services/subscription.service.ts`)
```typescript
class SubscriptionService {
  getPlans(): Promise<Plan[]>
  getMySubscription(): Promise<Subscription | null>
  createCheckoutSession(planName: string): Promise<{ url: string }>
  cancelSubscription(): Promise<void>
}
```

### 4b. Pricing Page (`web/src/app/[locale]/(main)/pricing/page.tsx`)
Layout:
```
Header: "Choose Your Plan"
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│   FREE      │ │   BASIC     │ │  PREMIUM    │
│             │ │  $4.99/mo   │ │  $9.99/mo   │
│ - SD        │ │ - HD        │ │ - 4K        │
│ - Co quang  │ │ - No ads    │ │ - No ads    │
│   cao       │ │ - All movies│ │ - All movies│
│ - Chi phim  │ │ - 2 devices │ │ - Download  │
│   free      │ │             │ │ - 4 devices │
│ [Current]   │ │ [Subscribe] │ │ [Subscribe] │
└─────────────┘ └─────────────┘ └─────────────┘

* Ca Basic va Premium deu xem duoc tat ca phim (ke ca premium content)
* Khac biet: chat luong (HD vs 4K), download, so thiet bi dong thoi

Success/Cancel banners (tu Stripe redirect query params)
```

### 4c. Checkout Flow
1. Click "Subscribe" → POST `/subscriptions/checkout` → nhan `{ url }`
2. `window.location.href = url` (redirect to Stripe Checkout)
3. Stripe redirect ve `/pricing?success=true` hoac `/pricing?cancelled=true`
4. Success: show toast + poll `/subscriptions/me` cho den khi webhook xu ly xong

**Khong can @stripe/stripe-js** — dung Stripe Checkout (hosted), frontend khong bao gio xu ly card data.

---

## Phase 5: Frontend — Premium UI + Profile

### 5a. Premium Lock Overlay (`web/src/components/PremiumLockOverlay.tsx`)
- Thay the video player khi user khong co active subscription
- Lock icon + message + "Upgrade Now" button → link `/pricing`
- Van show movie info, comments, reviews phia duoi (tease content)

### 5b. Modify Watch Page (`web/src/app/[locale]/(main)/watch/[slug]/page.tsx`)
```
if (movie.isPremium && !hasSubscription) {
  return <PremiumLockOverlay />
}
return <VideoPlayer ... />
```

### 5c. Movie Cards — them Premium lock icon
- Tren movie card: neu `isPremium`, show lock icon nho ben canh Premium badge
- Click van vao movie detail, nhung watch page se bi gate

### 5d. Profile — Subscription Section (`web/src/app/[locale]/(main)/profile/page.tsx`)
Them section moi:
```
┌─ My Subscription ────────────────────────┐
│ Plan: Premium          Status: Active    │
│ Next billing: April 22, 2026             │
│                                          │
│ [Cancel Subscription]   [Change Plan]    │
└──────────────────────────────────────────┘

┌─ Subscription History ───────────────────┐
│ Premium  Mar 22 - Apr 22  Active         │
│ Basic    Feb 1 - Mar 1    Expired        │
└──────────────────────────────────────────┘
```

### 5e. i18n (`web/messages/en.json` + `vi.json`)
Them ~30 keys cho `Pricing` va `Subscription` namespaces.

---

## Phase 6: Admin Integration

### 6a. Subscription Analytics
Extend `api/src/admin/analytics/`:
- Repository: `countSubscriptionsByPlan()`, `getMonthlyRevenue()`, `getChurnRate()`
- Service: `getSubscriptionStats()` (cache 10 min)
- Controller: `GET /admin/analytics/subscriptions`

### 6b. Admin Dashboard
- Them subscription stat card (MRR, active subs, churn)
- Them chart subscriptions theo thoi gian

### 6c. Admin User Detail
- Show subscription status + history trong user detail panel
- Button "Grant Complimentary Subscription" de tang premium cho user

---

## Summary

| Phase | New Files | Modified Files | Effort |
|-------|-----------|---------------|--------|
| 0. Cleanup VIP | 0 | ~10 (schema, seeds, components, i18n) | Small-Medium |
| 1. DB + Stripe setup | 0 | 2 (schema, .env) | Small |
| 2. Backend module | 7 | 2 (main.ts, app.module) | Medium-High |
| 3. Premium gating | 1 guard | 3 (movie controller, mapper, admin-users) | Small |
| 4. Pricing page | 2 (service, page) | 0 | Medium |
| 5. Premium UI + profile | 1 component | 3 (watch, profile, cards) | Medium |
| 6. Admin integration | 0 | 4 (analytics repo/service/ctrl, dashboard) | Small |
| **Total** | **~11 new** | **~24 modified** | |

## Key Design Decisions

1. **Bo VIP Role** — subscription la single source of truth, khong can 2 co che
2. **Stripe Checkout (hosted)** thay vi Stripe Elements — PCI compliant, it code, van demo duoc full integration
3. **stripeCustomerId tren User** — persist qua nhieu subscriptions, khong mat khi cancel
4. **Redis cache subscription status** — SubscriptionGuard se hit moi request watch, cache 5 min giam DB load
5. **Webhook-first** — subscription lifecycle driven by Stripe events, khong dua vao frontend optimistic updates
6. **Graceful degradation** — watch page van load metadata + comments, chi gate video player
7. **Complimentary subscription** — admin tang premium bang cach tao subscription record, khong can VIP role
8. **Cron backup** — moi 6h quet expired subscriptions phong truong hop miss webhook

## Verification

1. **Stripe Test**: Dung Stripe test card `4242 4242 4242 4242` de test checkout flow
2. **Webhook local**: `stripe listen --forward-to localhost:3001/subscriptions/webhook` (Stripe CLI)
3. **Premium Gate**: Tao movie voi `isPremium: true` → user free khong xem duoc, subscriber (Basic hoac Premium) deu xem duoc
4. **Cancel flow**: Subscribe → cancel → verify end of period → subscription expired
5. **Complimentary**: Admin grant subscription → user co the xem premium content
6. **Admin**: Check subscription analytics hien thi dung tren dashboard
7. **Lint + Test**: `pnpm run lint && pnpm run test` (api) + `npm run lint` (web)
