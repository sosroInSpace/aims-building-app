import { UserBusiness } from "../business";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const { userId, currentPassword, newPassword } = await request.json();

        // First get the user to check current password
        let user = await UserBusiness.Get(userId);
        if (!user) {
            return NextResponse.json({ error: "User not found." }, { status: 404 });
        }

        // Check if entered current password matches User's password
        if (!(await bcrypt.compare(currentPassword, user.PasswordHash))) {
            return NextResponse.json({ error: 'The password you entered for "Current Password" does not match your current password.' }, { status: 400 });
        }

        // Update password with new hash
        await UserBusiness.UpdatePassword(userId, await bcrypt.hash(newPassword, 12));

        return NextResponse.json({ status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
