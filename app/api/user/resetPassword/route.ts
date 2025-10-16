import { UserBusiness } from "../business";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const { userId, newPassword } = await request.json();

        // First check if entered current password matches User's password
        // let user:UserModel = await GetUser(userId);
        // if (!(await bcrypt.compare(currentPassword, user.PasswordHash))) {
        //     return NextResponse.json({ status: 500, error: "The password you entered for \"Current Password\" does not match your current password." });
        // }

        await UserBusiness.UpdatePassword(userId, await bcrypt.hash(newPassword, 12));

        return NextResponse.json({ status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
