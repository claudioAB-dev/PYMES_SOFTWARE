CREATE TYPE "public"."cfdi_type" AS ENUM('I', 'E', 'T', 'N', 'P');--> statement-breakpoint
CREATE TYPE "public"."sat_request_status" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');--> statement-breakpoint
CREATE TABLE "fiscal_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"uuid" varchar(36) NOT NULL,
	"issuer_rfc" varchar(13),
	"receiver_rfc" varchar(13),
	"issue_date" timestamp,
	"type" "cfdi_type",
	"subtotal" numeric(12, 2),
	"tax" numeric(12, 2),
	"total" numeric(12, 2),
	"storage_path_xml" varchar(255),
	"storage_path_pdf" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	CONSTRAINT "fiscal_documents_uuid_unique" UNIQUE("uuid")
);
--> statement-breakpoint
CREATE TABLE "sat_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"pac_request_id" varchar(255),
	"status" "sat_request_status" DEFAULT 'PENDING',
	"period_start" date,
	"period_end" date,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_accountant" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "fiscal_documents" ADD CONSTRAINT "fiscal_documents_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sat_requests" ADD CONSTRAINT "sat_requests_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

-- Re-escribir la función de trigger para incluir is_accountant
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, is_accountant)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name',
    COALESCE((NEW.raw_user_meta_data ->> 'is_accountant')::boolean, false)
  );
  RETURN NEW;
END;
$$;