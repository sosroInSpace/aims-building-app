"use client";

import { JC_Utils } from "../Utils";
import { validateCredentials } from "../actions";
import { JC_PostRaw } from "../apiServices/JC_PostRaw";
import JC_Form from "../components/JC_Form/JC_Form";
import JC_Title from "../components/JC_Title/JC_Title";
import { FieldTypeEnum } from "../enums/FieldType";
import { LocalStorageKeyEnum } from "../enums/LocalStorageKey";
import { D_FieldModel_Email } from "../models/ComponentModels/JC_Field";
import styles from "./page.module.scss";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Page_Login() {
    const router = useRouter();

    // - STATE - //

    const [loginEmail, setLoginEmail] = useState<string>("");
    const [loginPassword, setLoginPassword] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>("");

    // - EFFECTS - //

    useEffect(() => {
        if (!JC_Utils.isOnMobile()) {
            setTimeout(
                () =>
                    (
                        document.getElementById(
                            "login-first-input",
                        ) as HTMLInputElement
                    )?.select(),
                0,
            );
        }

        // Check for forgot password message (with incognito mode safety)
        const forgotPasswordSent = JC_Utils.safeLocalStorageGetItem(
            LocalStorageKeyEnum.JC_ShowForgotPasswordSent,
        );
        if (forgotPasswordSent === "1") {
            JC_Utils.showToastSuccess(
                "A password reset link has been sent to your email!",
            );
            JC_Utils.safeLocalStorageSetItem(
                LocalStorageKeyEnum.JC_ShowForgotPasswordSent,
                "0",
            );
        }

        // Check if we're in incognito mode and warn user if needed
        const isIncognito = (() => {
            try {
                localStorage.setItem("incognito-test", "test");
                localStorage.removeItem("incognito-test");
                return false;
            } catch (e) {
                return true;
            }
        })();

        if (isIncognito) {
            console.log(
                "Incognito mode detected - some features may be limited",
            );
        }
    }, []);

    // - HANDLES - //

    async function login() {
        setIsLoading(true);
        setErrorMessage("");

        try {
            // Clear any existing localStorage cache before login (safe for incognito)
            JC_Utils.clearAllLocalStorage();
            // Set welcome flag (needs to be after clearAllLocalStorage)
            JC_Utils.safeLocalStorageSetItem(
                LocalStorageKeyEnum.JC_ShowLoggedInWelcome,
                "1",
            );

            let result = await validateCredentials(
                loginEmail.toLowerCase(),
                loginPassword,
            );
            // IF error
            if (result.error) {
                // Check if 2FA is required
                if (result.error === "two_factor_required") {
                    // Store password temporarily for 2FA verification
                    sessionStorage.setItem("tempPassword", loginPassword);
                    // Generate and send 2FA code
                    await JC_PostRaw("user/generate2FACode", {
                        email: loginEmail.toLowerCase(),
                    });
                    // Redirect to 2FA page
                    router.push(
                        `/twoFactorAuth?email=${encodeURIComponent(loginEmail.toLowerCase())}`,
                    );
                } else {
                    setErrorMessage(result.error);
                    setIsLoading(false);
                }
                // ELSE sign in with proper redirect handling for incognito mode
            } else {
                const signInResult = await signIn("credentials", {
                    email: loginEmail.toLowerCase(),
                    password: loginPassword,
                    callbackUrl: "/users",
                    redirect: false, // Handle redirect manually for better incognito support
                });

                if (signInResult?.error) {
                    setErrorMessage("Login failed. Please try again.");
                    setIsLoading(false);
                } else if (signInResult?.ok) {
                    // Manual redirect for incognito mode compatibility
                    window.location.href = "/users";
                } else {
                    setErrorMessage(
                        "Unexpected error occurred. Please try again.",
                    );
                    setIsLoading(false);
                }
            }
        } catch (error) {
            console.error("Login error:", error);
            setErrorMessage("Login failed. Please try again.");
            setIsLoading(false);
        }
    }

    // - Main - //

    return (
        <div className={styles.mainContainer}>
            <div className={styles.formContainer}>
                <div style={{ width: "100%" }}>
                    <img
                        src="https://aimsengineering.com.au/wp-content/themes/aimsengineering/images/aims-engineering-logo.webp"
                        alt="Aims Engineering"
                        className="main-logo"
                        style={{
                            width: 300,
                            height: "auto",
                        }}
                    />
                </div>
                {/* Title */}
                <JC_Title title="Login" />

                {/* Form */}
                <JC_Form
                    submitButtonText="Login"
                    onSubmit={login}
                    isLoading={isLoading}
                    errorMessage={errorMessage}
                    fields={[
                        // Email
                        {
                            ...D_FieldModel_Email(),
                            inputId: "login-first-input",
                            onChange: (newValue) => setLoginEmail(newValue),
                            value: loginEmail,
                        },
                        // Password
                        {
                            inputId: "login-password-input",
                            type: FieldTypeEnum.Password,
                            label: "Password",
                            onChange: (newValue) => setLoginPassword(newValue),
                            value: loginPassword,
                            validate: (v: any) =>
                                JC_Utils.stringNullOrEmpty(v)
                                    ? "Enter a password."
                                    : "",
                        },
                    ]}
                />

                {/* Forgot Password */}
                <div
                    className={styles.smallTextButton}
                    onClick={() => router.push("forgotPassword")}
                >
                    Forgot Password?
                </div>
            </div>
        </div>
    );
}
