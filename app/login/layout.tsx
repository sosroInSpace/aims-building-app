import { auth } from "../auth";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

// Site Metadata
export const metadata: Metadata = {
    title: `${process.env.NAME} - Login`,
    description: "Login to your account."
};

export default async function Layout_Login(
    _: Readonly<{
        children: React.ReactNode;
    }>
) {
    // - AUTH - //

    const session = await auth();
    if (session) {
        // redirect("/account");
    }

    // - MAIN - //

    return _.children;
}
