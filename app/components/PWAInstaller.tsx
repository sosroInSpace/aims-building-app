"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
        outcome: "accepted" | "dismissed";
        platform: string;
    }>;
    prompt(): Promise<void>;
}

declare global {
    interface WindowEventMap {
        beforeinstallprompt: BeforeInstallPromptEvent;
    }
}

export default function PWAInstaller() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showInstallButton, setShowInstallButton] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        // Register service worker only if not in incognito mode
        if ("serviceWorker" in navigator) {
            // Check if we're in incognito mode by testing localStorage
            const isIncognito = (() => {
                try {
                    localStorage.setItem("test", "test");
                    localStorage.removeItem("test");
                    return false;
                } catch (e) {
                    return true;
                }
            })();

            if (!isIncognito) {
                window.addEventListener("load", () => {
                    navigator.serviceWorker
                        .register("/sw.js")
                        .then(registration => {
                            console.log("SW registered: ", registration);
                        })
                        .catch(registrationError => {
                            console.log("SW registration failed: ", registrationError);
                        });
                });
            } else {
                console.log("Incognito mode detected, skipping service worker registration");
            }
        }

        // Listen for the beforeinstallprompt event
        const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later
            setDeferredPrompt(e);
            // Show the install button
            setShowInstallButton(true);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

        // Listen for the appinstalled event
        window.addEventListener("appinstalled", () => {
            console.log("PWA was installed");
            setShowInstallButton(false);
            setDeferredPrompt(null);
        });

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === "accepted") {
            console.log("User accepted the install prompt");
        } else {
            console.log("User dismissed the install prompt");
        }

        // Clear the deferredPrompt
        setDeferredPrompt(null);
        setShowInstallButton(false);
    };

    // Only show on Account page and if install button should be shown
    if (!showInstallButton || pathname !== "/account") {
        return null;
    }

    return (
        <div
            style={{
                position: "fixed",
                bottom: "20px",
                right: "20px",
                zIndex: 1000,
                backgroundColor: "#031363",
                color: "white",
                padding: "12px 20px",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
                border: "none",
                display: "flex",
                alignItems: "center",
                gap: "8px"
            }}
            onClick={handleInstallClick}
        >
            <span>📱</span>
            Install App
        </div>
    );
}
