"use client";

import JC_BackgroundGlow from "../JC_BackgroundGlow/JC_BackgroundGlow";
import { usePathname } from "next/navigation";

export default function JC_AdminBackground() {
    const pathname = usePathname();

    // Only show the background glow on admin pages
    const isAdminPage = pathname?.startsWith("/admin");

    if (!isAdminPage) {
        return null;
    }

    return <JC_BackgroundGlow />;
}
