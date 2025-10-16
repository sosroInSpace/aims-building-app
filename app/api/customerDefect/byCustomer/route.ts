import { JC_Utils_Business } from "@/app/Utils";
import { CustomerDefectModel } from "@/app/models/CustomerDefect";
import { unstable_noStore } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Get CustomerDefects by CustomerId
export async function GET(request: NextRequest) {
    try {
        unstable_noStore();
        const params = new URL(request.url).searchParams;
        const customerId = params.get("customerId");

        if (!customerId) {
            return NextResponse.json({ error: "Missing 'customerId' parameter" }, { status: 400 });
        }

        // Use sqlGetList with WHERE clause to filter by CustomerId
        const whereClause = `main."CustomerId" = '${customerId}'`;

        const result = await JC_Utils_Business.sqlGetList<CustomerDefectModel>(CustomerDefectModel, whereClause, {
            PageSize: undefined,
            PageIndex: undefined,
            Sorts: [{ SortField: "CreatedAt", SortAsc: false }]
        });
        return NextResponse.json({ result }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
