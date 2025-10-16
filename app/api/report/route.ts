import { ReportBusiness } from "./business";
import { JC_Utils_Business } from "@/app/Utils";
import { ReportModel } from "@/app/models/Report";
import { unstable_noStore } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// ------- //
// - GET - //
// ------- //

// Get by "Id"
export async function GET(request: NextRequest) {
    try {
        unstable_noStore();
        const params = new URL(request.url).searchParams;
        const id = params.get("id");

        if (!id) {
            return NextResponse.json({ error: "Missing 'id' parameter" }, { status: 400 });
        }

        let result = await JC_Utils_Business.sqlGet(ReportModel, id);
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
            const dataList: ReportModel[] = await request.json();
            await ReportBusiness.CreateList(dataList);
        } else {
            const data: ReportModel = await request.json();
            await ReportBusiness.Create(data);
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
            const dataList: ReportModel[] = await request.json();
            await ReportBusiness.UpdateList(dataList);
        } else {
            const data: ReportModel = await request.json();
            await ReportBusiness.Update(data);
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
        const ids = params.get("ids");

        if (ids) {
            const idList: string[] = ids.split(",");
            for (const reportId of idList) {
                await JC_Utils_Business.sqlDelete(ReportModel, reportId);
            }
        } else if (id) {
            await JC_Utils_Business.sqlDelete(ReportModel, id);
        } else {
            return NextResponse.json({ error: "Missing 'id' or 'ids' parameter" }, { status: 400 });
        }

        return NextResponse.json({ status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
