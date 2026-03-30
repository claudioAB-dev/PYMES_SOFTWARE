import { config } from "dotenv";
config({ path: ".env" });
config({ path: ".env.local" });

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from "drizzle-orm";

let url = process.env.DATABASE_URL!;
url = url.replace(":6543", ":5432");

const client = postgres(url, { ssl: 'require', max: 1 });
const db = drizzle(client);

async function migrate() {
    try {
        console.log("Connecting securely to", url.substring(0, 30) + "...");
        
        console.log("Adding enum...");
        await db.execute(sql`DO $$ BEGIN
            CREATE TYPE "batch_quality_status" AS ENUM ('QUARANTINE', 'AVAILABLE', 'REJECTED');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;`);
        console.log("Enum created/exists");

        console.log("Adding columns...");
        await db.execute(sql`DO $$ BEGIN
            ALTER TABLE "product_batches" ADD COLUMN "status" "batch_quality_status" DEFAULT 'QUARANTINE' NOT NULL;
        EXCEPTION
            WHEN duplicate_column THEN null;
        END $$;`);
        
        await db.execute(sql`DO $$ BEGIN
            ALTER TABLE "product_batches" ADD COLUMN "quality_notes" text;
        EXCEPTION
            WHEN duplicate_column THEN null;
        END $$;`);

        console.log("Migration successful!");
    } catch (e) {
        console.error("Migration failed:", e);
    }
    process.exit(0);
}

migrate();
