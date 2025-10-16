import { UserBusiness } from "./business";
import { JC_Utils_Business } from "@/app/Utils";
import { UserModel } from "@/app/models/User";
import bcrypt from "bcryptjs";
import { unstable_noStore } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

// Get by "Id" or by "userEmail"
export async function GET(request: NextRequest) {
    try {
        unstable_noStore();
        const params = new URL(request.url).searchParams;
        const id = params.get("id");
        const userEmail = params.get("userEmail");

        let result;
        if (id) {
            // Get by ID using sqlGet to populate extended fields
            result = await JC_Utils_Business.sqlGet(UserModel, id);
        } else if (userEmail) {
            // Get by email using business method (no extended fields needed for login)
            result = await UserBusiness.GetByEmail(userEmail.toLowerCase());
        } else {
            return NextResponse.json({ error: "Missing 'id' or 'userEmail' parameter" }, { status: 400 });
        }

        return NextResponse.json({ result }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}

// Create
export async function PUT(request: NextRequest) {
    try {
        const requestData: { userData: UserModel; password: string } = await request.json();
        const userData = requestData.userData;
        const password = requestData.password;

        // Ensure email is lowercase
        userData.Email = userData.Email.toLowerCase();

        // Check if email already exists
        if ((await UserBusiness.GetByEmail(userData.Email)) != null) {
            return NextResponse.json({ error: "This email already exists!" }, { status: 500 });
        }

        userData.PasswordHash = await bcrypt.hash(password, 12);

        await UserBusiness.Create(userData);
        return NextResponse.json({ status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}

// Update
export async function POST(request: NextRequest) {
    try {
        const userData: UserModel = await request.json();

        await UserBusiness.Update(userData);

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

        await JC_Utils_Business.sqlDelete(UserModel, id);

        return NextResponse.json({ status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
