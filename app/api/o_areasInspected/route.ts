import { O_AreasInspectedBusiness } from "./business";
import { JC_Utils_Business } from "@/app/Utils";
import { O_AreasInspectedModel } from "@/app/models/O_AreasInspected";
import { unstable_noStore } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Get single O_AreasInspected
export async function GET(request: NextRequest) {
    try {
        unstable_noStore();
        const { searchParams } = new URL(request.url);
        const code = searchParams.get("code");

        if (!code) {
            return NextResponse.json({ error: "Code parameter is required" }, { status: 400 });
        }

        const result = await JC_Utils_Business.sqlGet(O_AreasInspectedModel, code);
        return NextResponse.json({ result }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}

// Create single O_AreasInspected
export async function PUT(request: NextRequest) {
    try {
        unstable_noStore();
        const data: O_AreasInspectedModel = await request.json();
        const result = await O_AreasInspectedBusiness.Create(data);
        return NextResponse.json({ result }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}

// Update single O_AreasInspected
export async function POST(request: NextRequest) {
    try {
        unstable_noStore();
        const data: O_AreasInspectedModel = await request.json();
        const result = await O_AreasInspectedBusiness.Update(data);
        return NextResponse.json({ result }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}

// Delete single O_AreasInspected
export async function DELETE(request: NextRequest) {
    try {
        unstable_noStore();
        const { searchParams } = new URL(request.url);
        const code = searchParams.get("code");

        if (!code) {
            return NextResponse.json({ error: "Code parameter is required" }, { status: 400 });
        }

        const result = await O_AreasInspectedBusiness.Delete(code);
        return NextResponse.json({ result }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
