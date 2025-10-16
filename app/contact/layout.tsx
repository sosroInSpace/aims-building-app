import type { Metadata } from "next";

// Site Metadata
export const metadata: Metadata = {
    title: `${process.env.NAME} - Contact`,
    description: `Contact ${process.env.NAME} for more info.`
};

export default async function Layout_Contact(
    _: Readonly<{
        children: React.ReactNode;
    }>
) {
    return _.children;
}
