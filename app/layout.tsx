import { auth } from "./auth";
import JC_Header from "./components/JC_Header/JC_Header";
import PWAHead from "./components/PWAHead";
import PWAInstaller from "./components/PWAInstaller";
import styles from "./layout.module.scss";
import TempComingSoon from "./tempComingSoon";
import { shouldHideHeaderFooter } from "./utils/pageConfig";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import { Open_Sans, Special_Elite, Margarine } from "next/font/google";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ToastContainer } from "react-toastify";

// Site Metadata
export const metadata: Metadata = {
    title: process.env.NAME,
    description: "Building Inspection site for AIMS Engineering.",
    robots: {
        index: false,
        follow: false,
        googleBot: {
            index: false,
            follow: false
        }
    },
    manifest: "/manifest.json",
    themeColor: "#031363",
    viewport: {
        width: "device-width",
        initialScale: 1
    },
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "AIMS Inspections"
    },
    icons: {
        icon: "/logos/Main [Simple].webp",
        apple: "/logos/Main [Simple].webp"
    }
};

// Font
const openSans = Open_Sans({ subsets: ["latin"], variable: "--font-open-sans" });
const kaushanScript = Special_Elite({ weight: "400", subsets: ["latin"], variable: "--font-kaushan-script" });
const shadowsIntoLight = Margarine({ weight: "400", subsets: ["latin"], variable: "--title-font" });

// Site Root
export default async function Layout_Root({
    children
}: Readonly<{
    children: React.ReactNode;
}>) {
    // Get the current path to check if it's a demo page and if header/footer should be hidden
    const headersList = headers();
    const path = headersList.get("x-pathname") || headersList.get("x-invoke-path") || headersList.get("x-url") || "";
    // More robust path detection - also check the URL header and referer
    const url = headersList.get("x-url") || "";
    const referer = headersList.get("referer") || "";

    const isDemoPage = path.startsWith("/demo");
    const hideHeaderFooter = shouldHideHeaderFooter(path);

    const session = await auth();

    // Check if user is logged in, if not redirect to login page
    // Allow access to login, forgot password, reset password, and demo pages without authentication
    const allowedPagesWithoutAuth = ["/login", "/forgotPassword", "/resetPassword", "/contact", "/privacyPolicy"];
    const isAllowedPageWithoutAuth = allowedPagesWithoutAuth.some(allowedPath => path === allowedPath || path.startsWith(`${allowedPath}/`));

    // Additional check: if the URL contains 'login', consider it as login page
    const isOnLoginPage = path === "/login" || path.includes("/login") || url.includes("/login") || referer.includes("/login");

    // Only redirect if we're not already on an allowed page and not logged in and not on login page
    if (!session && !isDemoPage && !isAllowedPageWithoutAuth && !isOnLoginPage) {
        console.log("Redirecting to login from:", path);
        redirect("/login");
    }

    // Allow access to demo pages without authentication
    const showContent = true; // session || isDemoPage;

    return (
        <html lang="en">
            <head>
                <PWAHead />
            </head>

            <body className={`${styles.rootMainContainer} ${openSans.variable} ${kaushanScript.variable} ${shadowsIntoLight.variable}`} id="rootMainContainer">
                <div className={styles.mainLayout}>
                    {showContent && !hideHeaderFooter && <JC_Header />}

                    {showContent && (
                        <div className={styles.pageContainer}>
                            <SessionProvider session={session}>{children}</SessionProvider>
                        </div>
                    )}
                </div>

                {!showContent && <TempComingSoon />}

                <ToastContainer position="bottom-right" closeOnClick={true} />

                <SpeedInsights />

                <PWAInstaller />
            </body>
        </html>
    );
}
