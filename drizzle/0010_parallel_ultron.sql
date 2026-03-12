CREATE TYPE "public"."invoice_status" AS ENUM('pending', 'attached', 'not_required');--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "invoice_status" "invoice_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "cfdi_pdf_path" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "cfdi_xml_path" text;