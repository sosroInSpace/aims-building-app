import { O_SummaryBusiness } from "./business";
import { O_SummaryModel } from "@/app/models/O_Summary";
import { unstable_noStore } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Get single O_Summary
export async function GET(request: NextRequest) {
    try {
        unstable_noStore();
        const { searchParams } = new URL(request.url);
        const code = searchParams.get("code");

        if (!code) {
            return NextResponse.json({ error: "Code parameter is required" }, { status: 400 });
        }

        const result = await O_SummaryBusiness.Get(code);
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
            const dataList: O_SummaryModel[] = await request.json();
            await O_SummaryBusiness.CreateList(dataList);
        } else {
            const data: O_SummaryModel = await request.json();
            await O_SummaryBusiness.Create(data);
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
            const dataList: O_SummaryModel[] = await request.json();
            await O_SummaryBusiness.UpdateList(dataList);
        } else {
            const data: O_SummaryModel = await request.json();
            await O_SummaryBusiness.Update(data);
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
        const codes = params.get("codes");
        const code = params.get("code");

        if (codes) {
            const codeList = codes.split(",");
            await O_SummaryBusiness.DeleteList(codeList);
        } else if (code) {
            await O_SummaryBusiness.Delete(code);
        } else {
            return NextResponse.json({ error: "Code or codes parameter is required" }, { status: 400 });
        }

        return NextResponse.json({ status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
