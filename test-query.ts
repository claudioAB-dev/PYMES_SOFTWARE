import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { db } from "./src/db";
import { productionOrders } from "./src/db/schema";
import { eq } from "drizzle-orm";

async function test() {
    try {
        const res = await db.query.productionOrders.findMany({
            with: {
                product: {
                    columns: { name: true, sku: true, uom: true }
                }
            },
            limit: 1
        });
        console.log("SUCCESS! Result length:", res.length);
    } catch (e: any) {
        console.log("POSTGRES MESSAGE:", e.message);
        console.log("ORIGINAL ERROR MESSAGE:", e?.cause?.message || e.cause);
    }
    process.exit(0);
}

test();
