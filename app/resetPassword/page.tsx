"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { JC_Utils, JC_Utils_Dates, JC_Utils_Validation } from "../Utils";
import { JC_Get } from "../apiServices/JC_Get";
import { JC_PostRaw } from "../apiServices/JC_PostRaw";
import JC_Button from "../components/JC_Button/JC_Button";
import JC_Form from "../components/JC_Form/JC_Form";
import JC_Spinner from "../components/JC_Spinner/JC_Spinner";
import JC_Title from "../components/JC_Title/JC_Title";
import { FieldTypeEnum } from "../enums/FieldType";
import { UserModel } from "../models/User";
import styles from "./page.module.scss";

export default function Page_ResetPassword() {
    const params = useSearchParams();
    let userToken = params.get("token");

    // - STATE - //

    const [tokenValid, setTokenValid] = useState<boolean>();
    const [userId, setUserId] = useState<string>();
    const [userEmail, setUserEmail] = useState<string>();
    const [newPassword, setNewPassword] = useState<string>("");
    const [confirmNewPassword, setConfirmNewPassword] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [success, setSuccess] = useState<boolean>(false);

    // - INITIALISE - //

    useEffect(() => {
        // Get User with this token
        JC_Get<UserModel>(UserModel, UserModel.apiRoute_getByToken, { userToken: userToken }).then(user => {
            if (!user || JC_Utils_Dates.minutesBetweenDates(user.ChangePasswordTokenDate!, new Date()) > 30) {
                setTokenValid(false);
            } else {
                setTokenValid(true);
                setUserId(user.Id);
                setUserEmail(user.Email);
            }
        });
    }, [userToken]);

    // - HANDLES - //

    async function resetPassword() {
        setIsLoading(true);
        await JC_PostRaw<{ userId: string | undefined; newPassword: string }, { error?: string; success?: boolean }>("user/resetPassword", {
            userId: userId,
            newPassword: newPassword
        }).then(result => {
            if (result.error) {
                setErrorMessage(result.error);
            } else {
                setSuccess(true);
            }
            setIsLoading(false);
        });
    }

    // - MAIN - //

    return tokenValid == undefined ? (
        <JC_Spinner isPageBody />
    ) : !tokenValid ? (
        <div className={styles.tokenInvalid}>Token Invalid</div>
    ) : success ? (
        <div className={styles.successContainer}>
            <div>Your new password has been set!</div>
            <JC_Button text="Go back home" linkToPage="/" />
        </div>
    ) : (
        <div className={styles.mainContainer}>
            <JC_Title title="Reset Password" />

            <div className={styles.infoText}>Setting new password for user: {userEmail}</div>

            <JC_Form
                submitButtonText="Reset Password"
                onSubmit={resetPassword}
                isLoading={isLoading}
                errorMessage={errorMessage}
                fields={[
                    // New Password
                    {
                        inputId: "new-password-input",
                        type: FieldTypeEnum.Password,
                        label: "New Password",
                        onChange: newValue => setNewPassword(newValue),
                        value: newPassword,
                        validate: (v: any) => (JC_Utils.stringNullOrEmpty(v) ? "Enter a password." : !JC_Utils_Validation.validPassword(v) ? `Password invalid.` : "")
                    },
                    // Confirm New Password
                    {
                        inputId: "confirm-password-input",
                        type: FieldTypeEnum.Password,
                        label: "Confirm New Password",
                        onChange: newValue => setConfirmNewPassword(newValue),
                        value: confirmNewPassword,
                        validate: (v: any) => (JC_Utils.stringNullOrEmpty(v) ? "Confirm the password." : confirmNewPassword != newPassword ? "Passwords do not match" : "")
                    }
                ]}
            />
            <JC_Button text="Back to Login" linkToPage="login" overrideClass={styles.backToLoginButton} />
        </div>
    );
}
