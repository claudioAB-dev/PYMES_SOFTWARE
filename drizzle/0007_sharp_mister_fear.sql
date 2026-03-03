ALTER TABLE "order_items" ADD COLUMN "tax_amount" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "retention_amount" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "subtotal_amount" numeric(12, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "total_tax_amount" numeric(12, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "total_retention_amount" numeric(12, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "cost" numeric(12, 2) DEFAULT '0' NOT NULL;