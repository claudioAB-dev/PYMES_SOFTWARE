CREATE TABLE "bom_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_product_id" uuid NOT NULL,
	"component_product_id" uuid NOT NULL,
	"quantity" numeric(12, 2) NOT NULL,
	"scrap_factor" numeric(12, 2) DEFAULT '0' NOT NULL,
	"uom" text NOT NULL,
	"unit_cost" numeric(12, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bom_lines" ADD CONSTRAINT "bom_lines_parent_product_id_products_id_fk" FOREIGN KEY ("parent_product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bom_lines" ADD CONSTRAINT "bom_lines_component_product_id_products_id_fk" FOREIGN KEY ("component_product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;