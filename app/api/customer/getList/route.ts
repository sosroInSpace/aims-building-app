import { JC_Utils_Business } from "@/app/Utils";
import { auth } from "@/app/auth";
import { CustomerModel } from "@/app/models/Customer";
import { unstable_noStore } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Get all Customer
export async function GET(request: NextRequest) {
    try {
        unstable_noStore();

        // Get current authenticated user
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const currentUser = session.user;
        const { searchParams } = new URL(request.url);
        const paging = JC_Utils_Business.getPagingFromParams(searchParams, CustomerModel);

        // Build WHERE clause to only show customers created by the current user
        const whereClause = `main."UserId" = '${currentUser.Id}'`;

        let result = await JC_Utils_Business.sqlGetList<CustomerModel>(CustomerModel, whereClause, paging);

        return NextResponse.json({ result }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
