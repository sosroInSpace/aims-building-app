import type { Metadata } from "next";

// Site Metadata
export const metadata: Metadata = {
    title: `${process.env.NAME} - Forgot Password`,
    description: "Enter an email to change your password."
};

export default async function Layout_ForgotPassword(
    _: Readonly<{
        children: React.ReactNode;
    }>
) {
    return _.children;
}
