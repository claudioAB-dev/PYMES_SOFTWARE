import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config();

const client = postgres(process.env.DATABASE_URL!);

async function alterTable() {
    try {
        await client`ALTER TABLE "production_orders" ADD COLUMN IF NOT EXISTS "parent_order_id" uuid REFERENCES "production_orders"("id");`;
        console.log("Migration successful!");
    } catch (e) {
        console.error("Migration failed:", e);
    } finally {
        await client.end();
    }
}

alterTable();
