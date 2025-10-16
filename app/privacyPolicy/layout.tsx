import type { Metadata } from "next";

// Site Metadata
export const metadata: Metadata = {
    title: `${process.env.NAME} - Privacy Policy`,
    description: `${process.env.NAME}'s privacy policy.`
};

export default async function Layout_PrivacyPolicy(
    _: Readonly<{
        children: React.ReactNode;
    }>
) {
    // - MAIN - //

    return _.children;
}
