import { O_ObstructionsBusiness } from "./business";
import { JC_Utils_Business } from "@/app/Utils";
import { O_ObstructionsModel } from "@/app/models/O_Obstructions";
import { unstable_noStore } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Get single O_Obstructions
export async function GET(request: NextRequest) {
    try {
        unstable_noStore();
        const { searchParams } = new URL(request.url);
        const code = searchParams.get("code");

        if (!code) {
            return NextResponse.json({ error: "Code parameter is required" }, { status: 400 });
        }

        const result = await JC_Utils_Business.sqlGet(O_ObstructionsModel, code);
        return NextResponse.json({ result }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}

// Create single O_Obstructions
export async function PUT(request: NextRequest) {
    try {
        unstable_noStore();
        const data: O_ObstructionsModel = await request.json();
        const result = await O_ObstructionsBusiness.Create(data);
        return NextResponse.json({ result }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}

// Update single O_Obstructions
export async function POST(request: NextRequest) {
    try {
        unstable_noStore();
        const data: O_ObstructionsModel = await request.json();
        const result = await O_ObstructionsBusiness.Update(data);
        return NextResponse.json({ result }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}

// Delete single O_Obstructions
export async function DELETE(request: NextRequest) {
    try {
        unstable_noStore();
        const { searchParams } = new URL(request.url);
        const code = searchParams.get("code");

        if (!code) {
            return NextResponse.json({ error: "Code parameter is required" }, { status: 400 });
        }

        const result = await O_ObstructionsBusiness.Delete(code);
        return NextResponse.json({ result }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
