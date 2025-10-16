import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Property - AIMS Inspection",
    description: "Property management page"
};

export default function PropertyLayout({ children }: { children: React.ReactNode }) {
    return children;
}
