import { auth } from "../auth";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

// Site Metadata
export const metadata: Metadata = {
    title: `${process.env.NAME} - Two-Factor Authentication`,
    description: "Enter your two-factor authentication code."
};

export default async function Layout_TwoFactorAuth(
    _: Readonly<{
        children: React.ReactNode;
    }>
) {
    // - AUTH - //

    const session = await auth();
    if (session) {
        // If user is already logged in, redirect them to the appropriate page
        // Admins (EmployeeOfUserId is null) go to Users, non-admins go to Customer
        if (session.user?.EmployeeOfUserId == null) {
            redirect("/users");
        } else {
            redirect("/customer");
        }
    }

    // - MAIN - //

    return _.children;
}
