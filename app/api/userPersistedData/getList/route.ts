import { JC_Utils_Business } from "@/app/Utils";
import { UserPersistedDataModel } from "@/app/models/UserPersistedData";
import { unstable_noStore } from "next/cache";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Get all UserPersistedData
export async function GET() {
    try {
        unstable_noStore();
        const result = await JC_Utils_Business.sqlGetList(UserPersistedDataModel, undefined, {
            PageSize: undefined,
            PageIndex: undefined,
            Sorts: [{ SortField: "Id", SortAsc: true }]
        });
        return NextResponse.json({ result }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
