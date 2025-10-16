"use client";

import { JC_Utils } from "../Utils";
import { JC_Get } from "../apiServices/JC_Get";
import { JC_Post } from "../apiServices/JC_Post";
import { JC_PostRaw } from "../apiServices/JC_PostRaw";
import JC_Form from "../components/JC_Form/JC_Form";
import JC_Title from "../components/JC_Title/JC_Title";
import { LocalStorageKeyEnum } from "../enums/LocalStorageKey";
import { D_FieldModel_Email } from "../models/ComponentModels/JC_Field";
import { UserModel } from "../models/User";
import styles from "./page.module.scss";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function Page_LoginRegister() {
    const session = useSession();
    const router = useRouter();

    // - STATE - //

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>();
    const [email, setEmail] = useState<string>("");

    // - EFFECTS - //
    useEffect(() => {
        // Page title is handled by Next.js metadata in layout.tsx
    }, []);

    // - HANDLES - //

    async function forgotPassword() {
        setErrorMessage("");
        setIsLoading(true);
        const normalizedEmail = email.toLowerCase();
        // First check if this email exists on a user
        if (!(await JC_Get(UserModel, "user", { userEmail: normalizedEmail }))) {
            setErrorMessage("This email does not exist on a user!");
            setIsLoading(false);
        } else {
            // Generate token and trigger email
            await JC_PostRaw("user/triggerResetPasswordToken", { email: normalizedEmail });
            // Go back to Login
            localStorage.setItem(LocalStorageKeyEnum.JC_ShowForgotPasswordSent, "1");
            router.push("/login");
        }
    }

    // - Main - //

    return (
        <div className={styles.mainContainer}>
            <JC_Title title="Forgot Password" />
            <div className={styles.infoText}>A link will be sent to your email where you can set a new password.</div>
            <JC_Form
                submitButtonText="Submit"
                onSubmit={forgotPassword}
                isLoading={isLoading}
                errorMessage={errorMessage}
                fields={[
                    {
                        ...D_FieldModel_Email(),
                        inputId: "forgot-password-email-input",
                        onChange: newValue => setEmail(newValue),
                        value: email
                    }
                ]}
            />
        </div>
    );
}
