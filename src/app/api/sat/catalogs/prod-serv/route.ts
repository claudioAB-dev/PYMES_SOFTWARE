import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { satClavesProdServ } from "@/db/schema";
import { ilike, or } from "drizzle-orm";

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const q = searchParams.get("q");

    try {
        if (!q) {
            return NextResponse.json([]);
        }

        const results = await db.select()
            .from(satClavesProdServ)
            .where(
                or(
                    ilike(satClavesProdServ.id, `%${q}%`),
                    ilike(satClavesProdServ.descripcion, `%${q}%`)
                )
            )
            .limit(50);

        return NextResponse.json(results);
    } catch (error) {
        console.error("Error fetching SAT prod-serv catalog:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
