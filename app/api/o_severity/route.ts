import { O_SeverityBusiness } from "./business";
import { O_SeverityModel } from "@/app/models/O_Severity";
import { unstable_noStore } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Get single O_Severity
export async function GET(request: NextRequest) {
    try {
        unstable_noStore();
        const { searchParams } = new URL(request.url);
        const code = searchParams.get("code");

        if (!code) {
            return NextResponse.json({ error: "Code parameter is required" }, { status: 400 });
        }

        const result = await O_SeverityBusiness.Get(code);
        return NextResponse.json({ result }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}

// Create single O_Severity
export async function PUT(request: NextRequest) {
    try {
        unstable_noStore();
        const data: O_SeverityModel = await request.json();
        const result = await O_SeverityBusiness.Create(data);
        return NextResponse.json({ result }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}

// Update single O_Severity
export async function POST(request: NextRequest) {
    try {
        unstable_noStore();
        const data: O_SeverityModel = await request.json();
        const result = await O_SeverityBusiness.Update(data);
        return NextResponse.json({ result }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}

// Delete single O_Severity
export async function DELETE(request: NextRequest) {
    try {
        unstable_noStore();
        const { searchParams } = new URL(request.url);
        const code = searchParams.get("code");

        if (!code) {
            return NextResponse.json({ error: "Code parameter is required" }, { status: 400 });
        }

        const result = await O_SeverityBusiness.Delete(code);
        return NextResponse.json({ result }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
