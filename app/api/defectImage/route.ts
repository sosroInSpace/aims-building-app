import { DefectImageBusiness } from "./business";
import { JC_Utils_Business } from "@/app/Utils";
import { DefectImageModel } from "@/app/models/DefectImage";
import { unstable_noStore } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// ------- //
// - GET - //
// ------- //

// Get by "Id", "DefectId", or "ImageFileId"
export async function GET(request: NextRequest) {
    try {
        unstable_noStore();
        const params = new URL(request.url).searchParams;
        const id = params.get("id");
        const defectId = params.get("defectId");
        const imageFileId = params.get("imageFileId");

        let result;
        if (defectId) {
            result = await DefectImageBusiness.GetByDefectId(defectId);
        } else if (imageFileId) {
            result = await DefectImageBusiness.GetByImageFileId(imageFileId);
        } else if (id) {
            result = await JC_Utils_Business.sqlGet(DefectImageModel, id);
        } else {
            return NextResponse.json({ error: "Missing 'id', 'defectId', or 'imageFileId' parameter" }, { status: 400 });
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
            const dataList: DefectImageModel[] = await request.json();
            await DefectImageBusiness.CreateList(dataList);
            return NextResponse.json({ status: 200 });
        } else {
            const data: DefectImageModel = await request.json();
            const createdRecord = await DefectImageBusiness.Create(data);
            return NextResponse.json({ result: createdRecord }, { status: 200 });
        }
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
        const data: DefectImageModel = await request.json();
        await DefectImageBusiness.Update(data);
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

        await JC_Utils_Business.sqlDelete(DefectImageModel, id);
        return NextResponse.json({ status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
