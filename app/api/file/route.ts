import { FileBusiness } from "./business";
import { JC_Utils_Business } from "@/app/Utils";
import { FileModel } from "@/app/models/File";
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

        const result = await JC_Utils_Business.sqlGet(FileModel, id);
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
            const dataList: FileModel[] = await request.json();
            await FileBusiness.CreateList(dataList);
        } else {
            const data: FileModel = await request.json();
            await FileBusiness.Create(data);
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
            const dataList: FileModel[] = await request.json();
            await FileBusiness.UpdateList(dataList);
        } else {
            const data: FileModel = await request.json();
            await FileBusiness.Update(data);
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

        await JC_Utils_Business.sqlDelete(FileModel, id);
        return NextResponse.json({ status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
