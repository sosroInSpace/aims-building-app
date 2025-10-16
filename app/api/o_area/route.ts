import { O_AreaBusiness } from "./business";
import { O_AreaModel } from "@/app/models/O_Area";
import { unstable_noStore } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Get single O_Area
export async function GET(request: NextRequest) {
    try {
        unstable_noStore();
        const { searchParams } = new URL(request.url);
        const code = searchParams.get("code");

        if (!code) {
            return NextResponse.json({ error: "Code parameter is required" }, { status: 400 });
        }

        const result = await O_AreaBusiness.Get(code);
        return NextResponse.json({ result }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}

// Create single O_Area
export async function PUT(request: NextRequest) {
    try {
        unstable_noStore();
        const data: O_AreaModel = await request.json();
        const result = await O_AreaBusiness.Create(data);
        return NextResponse.json({ result }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}

// Update single O_Area
export async function POST(request: NextRequest) {
    try {
        unstable_noStore();
        const data: O_AreaModel = await request.json();
        const result = await O_AreaBusiness.Update(data);
        return NextResponse.json({ result }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}

// Delete single O_Area
export async function DELETE(request: NextRequest) {
    try {
        unstable_noStore();
        const { searchParams } = new URL(request.url);
        const code = searchParams.get("code");

        if (!code) {
            return NextResponse.json({ error: "Code parameter is required" }, { status: 400 });
        }

        const result = await O_AreaBusiness.Delete(code);
        return NextResponse.json({ result }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
