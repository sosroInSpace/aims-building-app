"use client";

import { JC_Utils } from "../Utils";
import { authenticate } from "../actions";
import { JC_PostRaw } from "../apiServices/JC_PostRaw";
import JC_Form from "../components/JC_Form/JC_Form";
import JC_Title from "../components/JC_Title/JC_Title";
import { FieldTypeEnum } from "../enums/FieldType";
import styles from "./page.module.scss";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function Page_TwoFactorAuth() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get("email");

    // - STATE - //

    const [twoFactorCode, setTwoFactorCode] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [resendCooldown, setResendCooldown] = useState<number>(0);

    // - EFFECTS - //

    useEffect(() => {
        // If no email provided, redirect to login
        if (!email) {
            router.push("/login");
            return;
        }

        // Focus on input if not mobile
        if (!JC_Utils.isOnMobile()) {
            setTimeout(() => (document.getElementById("twofa-code-input") as HTMLInputElement)?.select(), 0);
        }

        // Start cooldown timer if needed
        if (resendCooldown > 0) {
            const timer = setTimeout(() => {
                setResendCooldown(resendCooldown - 1);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [email, router, resendCooldown]);

    // - HANDLE - //

    async function verify2FA() {
        if (!email || JC_Utils.stringNullOrEmpty(twoFactorCode)) return;

        setErrorMessage("");
        setIsLoading(true);

        try {
            // Get password from sessionStorage (stored during initial login attempt)
            const password = sessionStorage.getItem("tempPassword");
            if (!password) {
                setErrorMessage("Session expired. Please login again.");
                router.push("/login");
                return;
            }

            const result = await authenticate(email, password, twoFactorCode);

            if (result.error) {
                if (result.error === "invalid_2fa_code") {
                    setErrorMessage("Invalid or expired code. Please try again.");
                } else if (result.error === "two_factor_required") {
                    setErrorMessage("Two-factor authentication required.");
                } else {
                    setErrorMessage(result.error);
                }
                setIsLoading(false);
            } else {
                // Clear temporary password
                sessionStorage.removeItem("tempPassword");

                // Authentication successful, redirect to users page (same as login page)
                // The Users layout will handle redirecting non-admins to /customer
                window.location.href = "/users";
            }
        } catch (error) {
            console.error("2FA verification error:", error);
            setErrorMessage("An error occurred. Please try again.");
            setIsLoading(false);
        }
    }

    async function resendCode() {
        if (!email || resendCooldown > 0) return;

        try {
            await JC_PostRaw("user/generate2FACode", { email });
            setResendCooldown(60); // 60 second cooldown
            JC_Utils.showToastSuccess("Verification code sent!");
        } catch (error) {
            console.error("Resend code error:", error);
            setErrorMessage("Failed to resend code. Please try again.");
        }
    }

    function goBackToLogin() {
        // Clear temporary password
        sessionStorage.removeItem("tempPassword");
        router.push("/login");
    }

    // - Main - //

    return (
        <div className={styles.mainContainer}>
            <div className={styles.formContainer}>
                {/* Title */}
                <JC_Title title="Two-Factor Authentication" />

                {/* Description */}
                <div className={styles.description}>We&apos;ve sent a 6-digit verification code to your email address. Please enter it below to complete your login.</div>

                {/* Form */}
                <JC_Form
                    submitButtonText="Verify Code"
                    onSubmit={verify2FA}
                    isLoading={isLoading}
                    errorMessage={errorMessage}
                    fields={[
                        // 2FA Code
                        {
                            inputId: "twofa-code-input",
                            type: FieldTypeEnum.Text,
                            label: "Verification Code",
                            placeholder: "000000",
                            onChange: newValue => setTwoFactorCode(newValue.replace(/\D/g, "").slice(0, 6)),
                            value: twoFactorCode,
                            validate: (v: any) => (JC_Utils.stringNullOrEmpty(v) ? "Enter the verification code." : v.length !== 6 ? "Code must be 6 digits." : "")
                        }
                    ]}
                />

                {/* Resend Container */}
                <div className={styles.resendContainer}>
                    <div className={styles.resendText}>Didn&apos;t receive the code?</div>
                    <div className={`${styles.smallTextButton} ${resendCooldown > 0 ? "disabled" : ""}`} onClick={resendCooldown > 0 ? undefined : resendCode}>
                        {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
                    </div>
                </div>

                {/* Back to Login */}
                <div className={styles.smallTextButton} onClick={goBackToLogin}>
                    Back to Login
                </div>
            </div>
        </div>
    );
}
