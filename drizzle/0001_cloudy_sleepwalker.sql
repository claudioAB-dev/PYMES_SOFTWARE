CREATE TYPE "public"."product_type" AS ENUM('PRODUCT', 'SERVICE');--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "sku" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "type" "product_type" DEFAULT 'PRODUCT' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "price" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "stock" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "buy_price";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "sell_price";