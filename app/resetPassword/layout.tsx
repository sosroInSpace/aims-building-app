import type { Metadata } from "next";

// Site Metadata
export const metadata: Metadata = {
    title: `${process.env.NAME} - Reset Password`,
    description: "Change your password."
};

export default async function Layout_ResetPassword(
    _: Readonly<{
        children: React.ReactNode;
    }>
) {
    return _.children;
}
