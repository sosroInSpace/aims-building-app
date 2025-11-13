import { sql } from "@vercel/postgres";
import { unstable_noStore } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Get image count for a specific defect using straight SQL
export async function GET(request: NextRequest) {
    try {
        unstable_noStore();
        const params = new URL(request.url).searchParams;
        const defectId = params.get("defectId");

        if (!defectId) {
            return NextResponse.json({ error: "Missing 'defectId' parameter" }, { status: 400 });
        }

        // Simple SQL query to count images for this defect
        const result = await sql`
            SELECT COUNT(*) as imagecount
            FROM public."DefectImage"
            WHERE "DefectId" = ${defectId}
              AND "Deleted" = 'False'
        `;

        const imageCount = parseInt(result.rows[0].imagecount) || 0;
        
        return NextResponse.json({ imageCount }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
