-- Add Stripe customer ID to users
ALTER TABLE "users" ADD COLUMN "stripe_customer_id" TEXT;
CREATE UNIQUE INDEX "users_stripe_customer_id_key" ON "users"("stripe_customer_id");

-- Add Stripe fields to subscriptions
ALTER TABLE "subscriptions" ADD COLUMN "stripe_customer_id" TEXT;
ALTER TABLE "subscriptions" ADD COLUMN "stripe_subscription_id" TEXT;
ALTER TABLE "subscriptions" ADD COLUMN "stripe_price_id" TEXT;
ALTER TABLE "subscriptions" ADD COLUMN "cancelled_at" TIMESTAMP(3);
CREATE UNIQUE INDEX "subscriptions_stripe_subscription_id_key" ON "subscriptions"("stripe_subscription_id");
