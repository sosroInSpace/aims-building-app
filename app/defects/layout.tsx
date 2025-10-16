import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Defects - AIMS Inspection",
    description: "Property defects management page"
};

export default function DefectsLayout({ children }: { children: React.ReactNode }) {
    return children;
}
