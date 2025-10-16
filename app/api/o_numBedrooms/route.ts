import { O_NumBedroomsBusiness } from "./business";
import { JC_Utils_Business } from "@/app/Utils";
import { O_NumBedroomsModel } from "@/app/models/O_NumBedrooms";
import { unstable_noStore } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// ------- //
// - GET - //
// ------- //

// Get by "Code"
export async function GET(request: NextRequest) {
    try {
        unstable_noStore();
        const params = new URL(request.url).searchParams;
        const code = params.get("code");

        if (!code) {
            return NextResponse.json({ error: "Missing 'code' parameter" }, { status: 400 });
        }

        let result = await JC_Utils_Business.sqlGet(O_NumBedroomsModel, code);
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
            const dataList: O_NumBedroomsModel[] = await request.json();
            await O_NumBedroomsBusiness.CreateList(dataList);
        } else {
            const data: O_NumBedroomsModel = await request.json();
            await O_NumBedroomsBusiness.Create(data);
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
        const sortOrderOnly = params.get("sortOrder") === "true";

        if (sortOrderOnly) {
            const { code, sortOrder } = await request.json();
            await O_NumBedroomsBusiness.UpdateSortOrder(code, sortOrder);
        } else {
            const data: O_NumBedroomsModel = await request.json();
            await O_NumBedroomsBusiness.Update(data);
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
        const code = params.get("code");

        if (!code) {
            return NextResponse.json({ error: "Missing 'code' parameter" }, { status: 400 });
        }

        await JC_Utils_Business.sqlDelete(O_NumBedroomsModel, code);

        return NextResponse.json({ status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
