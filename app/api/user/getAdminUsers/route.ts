import { JC_Utils_Business } from "@/app/Utils";
import { UserModel } from "@/app/models/User";
import { unstable_noStore } from "next/cache";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Get all Admin Users (users where EmployeeOfUserId is null)
export async function GET() {
    try {
        unstable_noStore();
        const result = await JC_Utils_Business.sqlGetList(UserModel, 'main."EmployeeOfUserId" IS NULL', {
            PageSize: undefined,
            PageIndex: undefined,
            Sorts: [{ SortField: "FirstName", SortAsc: true }]
        });
        return NextResponse.json({ result }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
