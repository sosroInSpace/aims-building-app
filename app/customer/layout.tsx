import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Customer - AIMS Inspection",
    description: "Customer report management page"
};

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
    return children;
}
