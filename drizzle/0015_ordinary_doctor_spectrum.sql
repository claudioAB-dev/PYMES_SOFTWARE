CREATE TYPE "public"."org_plan" AS ENUM('free', 'pro', 'manufactura');--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "stripe_customer_id" varchar(255);--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "stripe_subscription_id" varchar(255);--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "stripe_price_id" varchar(255);--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "plan" "org_plan" DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "subscription_status" varchar(50);--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "current_period_end" timestamp;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_stripe_customer_id_unique" UNIQUE("stripe_customer_id");--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id");