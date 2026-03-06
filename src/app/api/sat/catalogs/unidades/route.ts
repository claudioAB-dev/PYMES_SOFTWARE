import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { satClavesUnidad } from "@/db/schema";
import { ilike, or } from "drizzle-orm";

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const q = searchParams.get("q");

    try {
        if (!q) {
            return NextResponse.json([]);
        }

        const results = await db.select()
            .from(satClavesUnidad)
            .where(
                or(
                    ilike(satClavesUnidad.id, `%${q}%`),
                    ilike(satClavesUnidad.nombre, `%${q}%`)
                )
            )
            .limit(50);

        return NextResponse.json(results);
    } catch (error) {
        console.error("Error fetching SAT unidades catalog:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
