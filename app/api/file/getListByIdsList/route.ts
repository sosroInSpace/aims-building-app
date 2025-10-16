import { FileBusiness } from "../business";
import { JC_ListPagingResultModel } from "@/app/models/ComponentModels/JC_ListPagingModel";
import { FileModel } from "@/app/models/File";
import { unstable_noStore } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Get Files by list of IDs
export async function POST(request: NextRequest) {
    try {
        unstable_noStore();

        const body = await request.json();
        const fileIds = body.fileIds;

        if (!fileIds || !Array.isArray(fileIds)) {
            return NextResponse.json({ error: "Missing or invalid 'fileIds' in request body" }, { status: 400 });
        }

        // Filter out empty/invalid IDs
        const validFileIds = fileIds.filter(id => id && typeof id === "string" && id.trim().length > 0);

        if (validFileIds.length === 0) {
            const emptyResult: JC_ListPagingResultModel<FileModel> = {
                ResultList: [],
                TotalCount: 0,
                TotalPages: 1
            };
            return NextResponse.json({ result: emptyResult }, { status: 200 });
        }

        const result = await FileBusiness.GetListByIdsList(validFileIds);

        const response: JC_ListPagingResultModel<FileModel> = {
            ResultList: result,
            TotalCount: result.length,
            TotalPages: 1
        };

        return NextResponse.json({ result: response }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
