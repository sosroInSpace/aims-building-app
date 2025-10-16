import { auth } from "../auth";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

// Site Metadata
export const metadata: Metadata = {
    title: `${process.env.NAME} - Users`,
    description: "Manage users and qualifications."
};

export default async function Layout_Users(
    _: Readonly<{
        children: React.ReactNode;
    }>
) {
    // - AUTH - //

    const session = await auth();

    // Only allow access if user is logged in AND is an admin (EmployeeOfUserId is null)
    if (!session || session.user?.EmployeeOfUserId != null) {
        redirect("/customer");
    }

    // - MAIN - //

    return _.children;
}
