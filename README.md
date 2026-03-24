# ngonluon

A modern movie streaming application built with Next.js and NestJS.

## Features
- **Movie Streaming**: High-quality video player with resume functionality.
- **Subscription System**: Multiple tiers (Basic, Premium) with Stripe integration.
- **User Profiles**: Watchlists, watch history, and account management.
- **Admin Dashboard**: Analytics, user management, and movie catalog orchestration.
- **Advanced Search**: Powered by Elasticsearch for fast and accurate discovery.
- **Robust Infrastructure**: Background processing with RabbitMQ, caching with Redis.

## Tech Stack

### Frontend (`/web`)
- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **I18n**: Support for English and Vietnamese

### Backend (`/api`)
- **Framework**: [NestJS](https://nestjs.com/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Database**: PostgreSQL
- **Message Broker**: RabbitMQ
- **Caching**: Redis
- **Search Engine**: Elasticsearch
- **Payments**: Stripe

## Getting Started

### Prerequisites
- Node.js (v20+)
- Docker and Docker Compose
- pnpm (API) / npm (Web)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/hoangtruonguit/ngonluon.git
   cd ngonluon
   ```

2. **Setup API**:
   ```bash
   cd api
   pnpm install
   cp .env.example .env # Fill in your credentials
   docker-compose up -d
   npx prisma migrate dev
   pnpm run start:dev
   ```

3. **Setup Web**:
   ```bash
   cd ../web
   npm install
   cp .env.example .env.local
   npm run dev
   ```

## License
MIT
