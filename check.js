require('dotenv').config({ path: '.env' })
const postgres = require('postgres')
const sql = postgres(process.env.DATABASE_URL)

async function apply() {
    try {
        await sql`CREATE TABLE IF NOT EXISTS "sat_credentials" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
            "organization_id" uuid NOT NULL,
            "rfc" varchar(13) NOT NULL,
            "cer_base64" text NOT NULL,
            "key_base64" text NOT NULL,
            "encrypted_password" text NOT NULL,
            "iv" text NOT NULL,
            "created_at" timestamp DEFAULT now() NOT NULL,
            "updated_at" timestamp DEFAULT now() NOT NULL,
            CONSTRAINT "sat_credentials_organization_id_unique" UNIQUE("organization_id")
        );`
        console.log("Created table sat_credentials")

        await sql`DO $$ BEGIN ALTER TABLE "sat_credentials" ADD CONSTRAINT "sat_credentials_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`
        console.log("Added foreign key constraint")
    } catch (e) {
        console.error(e)
    } finally {
        await sql.end()
    }
}

apply()
