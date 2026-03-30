CREATE TYPE "public"."batch_quality_status" AS ENUM('QUARANTINE', 'AVAILABLE', 'REJECTED');--> statement-breakpoint
ALTER TABLE "product_batches" ADD COLUMN "status" "batch_quality_status" DEFAULT 'QUARANTINE' NOT NULL;--> statement-breakpoint
ALTER TABLE "product_batches" ADD COLUMN "quality_notes" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "is_manufacturable" boolean DEFAULT false NOT NULL;