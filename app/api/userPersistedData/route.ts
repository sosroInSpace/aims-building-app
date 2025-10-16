import { UserPersistedDataBusiness } from "./business";
import { JC_Utils_Business } from "@/app/Utils";
import { UserPersistedDataModel } from "@/app/models/UserPersistedData";
import { unstable_noStore } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// ------- //
// - GET - //
// ------- //

// Get by "Id", by "UserId", or by "UserId and Code"
export async function GET(request: NextRequest) {
    try {
        unstable_noStore();
        const params = new URL(request.url).searchParams;
        const id = params.get("id");
        const userId = params.get("userId");
        const code = params.get("code");

        let result;
        if (userId && code) {
            result = await UserPersistedDataBusiness.GetByUserIdAndCode(userId, code);
        } else if (userId) {
            result = await UserPersistedDataBusiness.GetByUserId(userId);
        } else if (id) {
            result = await JC_Utils_Business.sqlGet(UserPersistedDataModel, id);
        } else {
            return NextResponse.json({ error: "Missing 'id' or 'userId' parameter" }, { status: 400 });
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
            const dataList: UserPersistedDataModel[] = await request.json();
            await UserPersistedDataBusiness.CreateList(dataList);
        } else {
            const data: UserPersistedDataModel = await request.json();
            await UserPersistedDataBusiness.Create(data);
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
        const valueOnly = params.get("valueOnly") === "true";

        if (valueOnly) {
            const { userId, code, value } = await request.json();
            await UserPersistedDataBusiness.UpdateValue(userId, code, value);
        } else {
            const data: UserPersistedDataModel = await request.json();
            await UserPersistedDataBusiness.Update(data);
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
        const userId = params.get("userId");
        const code = params.get("code");

        if (userId && code) {
            await UserPersistedDataBusiness.DeleteByUserIdAndCode(userId, code);
        } else if (id) {
            await JC_Utils_Business.sqlDelete(UserPersistedDataModel, id);
        } else {
            return NextResponse.json({ error: "Missing 'id' or 'userId and code' parameters" }, { status: 400 });
        }

        return NextResponse.json({ status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
