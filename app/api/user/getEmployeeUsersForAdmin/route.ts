import { JC_Utils_Business } from "@/app/Utils";
import { auth } from "@/app/auth";
import { UserModel } from "@/app/models/User";
import { unstable_noStore } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Get all employee users for the current admin user (users where EmployeeOfUserId equals current user's ID)
export async function GET(request: NextRequest) {
    try {
        unstable_noStore();

        // Get current user session
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const paging = JC_Utils_Business.getPagingFromParams(searchParams, UserModel);

        // Get users where EmployeeOfUserId equals the current user's ID
        const whereClause = `main."EmployeeOfUserId" = '${session.user.id}'`;

        const result = await JC_Utils_Business.sqlGetList(UserModel, whereClause, paging);
        return NextResponse.json({ result }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
