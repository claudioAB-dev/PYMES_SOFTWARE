import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import postgres from 'postgres';
const client = postgres(process.env.DATABASE_URL!);

async function alterTable() {
    try {
        await client`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "is_manufacturable" boolean DEFAULT false NOT NULL;`;
        console.log("Migration successful!");
    } catch (e) {
        console.error("Migration failed:", e);
    } finally {
        await client.end();
    }
}

alterTable();
