import { CustomerDefectBusiness } from "./business";
import { JC_Utils_Business } from "@/app/Utils";
import { CustomerDefectModel } from "@/app/models/CustomerDefect";
import { unstable_noStore } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// ------- //
// - GET - //
// ------- //

// Get by "Id" or by "CustomerId"
export async function GET(request: NextRequest) {
    try {
        unstable_noStore();
        const params = new URL(request.url).searchParams;
        const id = params.get("id");
        const customerId = params.get("customerId");

        let result;
        if (customerId) {
            result = await CustomerDefectBusiness.GetByCustomerId(customerId);
        } else if (id) {
            result = await JC_Utils_Business.sqlGet(CustomerDefectModel, id);
        } else {
            return NextResponse.json({ error: "Missing 'id' or 'customerId' parameter" }, { status: 400 });
        }

        return NextResponse.json({ result }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}

// ---------- //
// - CREATE - //
// ---------- //

export async function PUT(request: NextRequest) {
    try {
        const params = new URL(request.url).searchParams;
        const isList = params.get("list") === "true";

        if (isList) {
            const dataList: CustomerDefectModel[] = await request.json();
            await CustomerDefectBusiness.CreateList(dataList);
        } else {
            const data: CustomerDefectModel = await request.json();
            await CustomerDefectBusiness.Create(data);
        }

        return NextResponse.json({ status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}

// ---------- //
// - UPDATE - //
// ---------- //

export async function POST(request: NextRequest) {
    try {
        const params = new URL(request.url).searchParams;
        const isList = params.get("list") === "true";

        if (isList) {
            const dataList: CustomerDefectModel[] = await request.json();
            await CustomerDefectBusiness.UpdateList(dataList);
        } else {
            const data: CustomerDefectModel = await request.json();
            await CustomerDefectBusiness.Update(data);
        }

        return NextResponse.json({ status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}

// ---------- //
// - DELETE - //
// ---------- //

export async function DELETE(request: NextRequest) {
    try {
        const params = new URL(request.url).searchParams;
        const id = params.get("id");

        if (!id) {
            return NextResponse.json({ error: "Missing 'id' parameter" }, { status: 400 });
        }

        await JC_Utils_Business.sqlDelete(CustomerDefectModel, id);

        return NextResponse.json({ status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
