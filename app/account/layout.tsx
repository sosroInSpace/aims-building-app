import { auth } from "../auth";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

// Site Metadata
export const metadata: Metadata = {
    title: `${process.env.NAME} - Account`,
    description: "Edit your account info."
};

export default async function Layout_Account(
    _: Readonly<{
        children: React.ReactNode;
    }>
) {
    // - AUTH - //

    const session = await auth();
    if (!session) {
        redirect("/");
    }

    // - MAIN - //

    return _.children;
}
