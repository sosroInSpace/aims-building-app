import { JC_Utils_Business } from "@/app/Utils";
import { auth } from "@/app/auth";
import { CustomerModel } from "@/app/models/Customer";
import { unstable_noStore } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Get customers created by employees under the current admin (not including admin's own customers)
export async function GET(request: NextRequest) {
    try {
        unstable_noStore();
        const session = await auth();

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const currentUser = session.user;
        const { searchParams } = new URL(request.url);
        const paging = JC_Utils_Business.getPagingFromParams(searchParams, CustomerModel);

        // Only allow access if user is an admin (EmployeeOfUserId is null)
        if (currentUser.EmployeeOfUserId) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        // Get customers where the UserId belongs to employees of the current admin
        // This requires a JOIN with the User table to find employees
        const whereClause = `
            main."UserId" IN (
                SELECT u."Id" 
                FROM "User" u 
                WHERE u."EmployeeOfUserId" = '${currentUser.Id}'
            )
        `;

        const result = await JC_Utils_Business.sqlGetList<CustomerModel>(CustomerModel, whereClause, paging);

        return NextResponse.json({ result }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
