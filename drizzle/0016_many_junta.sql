ALTER TABLE "organizations" ALTER COLUMN "plan" SET DATA TYPE varchar(20);--> statement-breakpoint
ALTER TABLE "organizations" ALTER COLUMN "plan" SET DEFAULT 'free';--> statement-breakpoint
ALTER TABLE "organizations" ALTER COLUMN "subscription_status" SET DATA TYPE varchar(20);--> statement-breakpoint
DROP TYPE "public"."org_plan";