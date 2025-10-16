import { GlobalSettingsBusiness } from "./business";
import { JC_Utils_Business } from "@/app/Utils";
import { GlobalSettingsModel } from "@/app/models/GlobalSettings";
import { unstable_noStore } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// ------- //
// - GET - //
// ------- //

// Get by "Code"
export async function GET(request: NextRequest) {
    try {
        unstable_noStore();
        const params = new URL(request.url).searchParams;
        const code = params.get("code");

        if (!code) {
            return NextResponse.json({ error: "Missing 'code' parameter" }, { status: 400 });
        }

        let result = await JC_Utils_Business.sqlGet(GlobalSettingsModel, code);
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
            const settings: GlobalSettingsModel[] = await request.json();
            await GlobalSettingsBusiness.CreateList(settings);
        } else {
            const setting: GlobalSettingsModel = await request.json();
            await GlobalSettingsBusiness.Create(setting);
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
        const valueOnly = params.get("valueOnly") === "true";

        if (isList) {
            const settings: GlobalSettingsModel[] = await request.json();
            await GlobalSettingsBusiness.UpdateList(settings);
        } else if (valueOnly) {
            const setting: GlobalSettingsModel = await request.json();
            await GlobalSettingsBusiness.UpdateValue(setting.Code, setting.Value);
        } else {
            const setting: GlobalSettingsModel = await request.json();
            await GlobalSettingsBusiness.Update(setting);
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
        const code = params.get("code");
        const codes = params.get("codes");

        if (codes) {
            const codeList: string[] = codes.split(",");
            for (const singleCode of codeList) {
                await JC_Utils_Business.sqlDelete(GlobalSettingsModel, singleCode);
            }
        } else if (code) {
            await JC_Utils_Business.sqlDelete(GlobalSettingsModel, code);
        } else {
            return NextResponse.json({ error: "Missing 'code' or 'codes' parameter" }, { status: 400 });
        }

        return NextResponse.json({ status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
