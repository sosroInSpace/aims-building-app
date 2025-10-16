import { O_DefectOrientationBusiness } from "./business";
import { O_DefectOrientationModel } from "@/app/models/O_DefectOrientation";
import { unstable_noStore } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Get single O_DefectOrientation
export async function GET(request: NextRequest) {
    try {
        unstable_noStore();
        const { searchParams } = new URL(request.url);
        const code = searchParams.get("code");

        if (!code) {
            return NextResponse.json({ error: "Code parameter is required" }, { status: 400 });
        }

        const result = await O_DefectOrientationBusiness.Get(code);
        return NextResponse.json({ result }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}

// Create single O_DefectOrientation
export async function PUT(request: NextRequest) {
    try {
        unstable_noStore();
        const data: O_DefectOrientationModel = await request.json();
        const result = await O_DefectOrientationBusiness.Create(data);
        return NextResponse.json({ result }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}

// Update single O_DefectOrientation
export async function POST(request: NextRequest) {
    try {
        unstable_noStore();
        const data: O_DefectOrientationModel = await request.json();
        const result = await O_DefectOrientationBusiness.Update(data);
        return NextResponse.json({ result }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}

// Delete single O_DefectOrientation
export async function DELETE(request: NextRequest) {
    try {
        unstable_noStore();
        const { searchParams } = new URL(request.url);
        const code = searchParams.get("code");

        if (!code) {
            return NextResponse.json({ error: "Code parameter is required" }, { status: 400 });
        }

        const result = await O_DefectOrientationBusiness.Delete(code);
        return NextResponse.json({ result }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
