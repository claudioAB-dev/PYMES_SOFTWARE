import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// Load .env only in development/local environments
if (process.env.NODE_ENV !== "production") {
    dotenv.config({ path: ".env.local" });
    dotenv.config({ path: ".env" });
}

export default defineConfig({
    schema: "./src/db/schema.ts",
    out: "./drizzle",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL!,
        ssl: true,
    },
});
