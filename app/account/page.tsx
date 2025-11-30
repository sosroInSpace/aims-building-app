"use client";

import { signOut, useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";
import { JC_Utils, JC_Utils_Validation } from "../Utils";
import { JC_Post } from "../apiServices/JC_Post";
import { JC_PostRaw } from "../apiServices/JC_PostRaw";
import JC_Button from "../components/JC_Button/JC_Button";
import JC_Checkbox from "../components/JC_Checkbox/JC_Checkbox";
import JC_Form from "../components/JC_Form/JC_Form";
import JC_Modal from "../components/JC_Modal/JC_Modal";
import JC_ModalConfirmation from "../components/JC_ModalConfirmation/JC_ModalConfirmation";
import JC_PasswordRequirements from "../components/JC_PasswordRequirements/JC_PasswordRequirements";
import JC_PhotoUpload from "../components/JC_PhotoUpload/JC_PhotoUpload";
import JC_Spinner from "../components/JC_Spinner/JC_Spinner";
import JC_Title from "../components/JC_Title/JC_Title";
import { FieldTypeEnum } from "../enums/FieldType";
import { JC_ConfirmationModalUsageModel } from "../models/ComponentModels/JC_ConfirmationModalUsage";
import { D_FieldModel_ABN, D_FieldModel_Company, D_FieldModel_Email, D_FieldModel_FirstName, D_FieldModel_LastName, D_FieldModel_Phone } from "../models/ComponentModels/JC_Field";
import { GlobalSettingsModel } from "../models/GlobalSettings";
import { UserModel } from "../models/User";
import styles from "./page.module.scss";

export default function Page_Account() {
    // - STATE - //

    const session = useSession();
    // Loading
    const [initialised, setInitialised] = useState<boolean>(false);
    const [saveLoading, setSaveLoading] = useState<boolean>(false);
    const [logoutLoading, setLogoutLoading] = useState<boolean>(false);
    // Account Details
    const [firstName, setFirstName] = useState<string>(session.data!.user.FirstName);
    const [lastName, setLastName] = useState<string>(session.data!.user.LastName);
    const [phone, setPhone] = useState<string>(session.data!.user.Phone ?? "");
    const [companyName, setCompanyName] = useState<string>(session.data!.user.CompanyName ?? "");
    const [abn, setABN] = useState<string>(session.data!.user.ABN ?? "");
    const [logoFileId, setLogoFileId] = useState<string>(session.data!.user.LogoFileId ?? "");
    const [enable2fa, setEnable2fa] = useState<boolean>(session.data!.user.Enable2fa ?? false);
    // Clear Logo State
    const [isClearLogoConfirmModalOpen, setIsClearLogoConfirmModalOpen] = useState<boolean>(false);
    // Confirmation
    const [confirmationModalData, setConfirmationModalData] = useState<JC_ConfirmationModalUsageModel | null>();
    const [confirmationLoading, setConfirmationLoading] = useState<boolean>(false);

    // Password change modal state
    const [passwordModalOpen, setPasswordModalOpen] = useState<boolean>(false);
    const [currentPassword, setCurrentPassword] = useState<string>("");
    const [newPassword, setNewPassword] = useState<string>("");
    const [confirmNewPassword, setConfirmNewPassword] = useState<string>("");
    const [passwordChangeLoading, setPasswordChangeLoading] = useState<boolean>(false);
    const [passwordChangeError, setPasswordChangeError] = useState<string>("");
    const [submitClicked, setSubmitClicked] = useState<boolean>(false);

    // - INITIALISE - //

    useEffect(() => {
        // Check if details were just updated to show success message
        if (localStorage.getItem("showUpdatedAccountDetailsSuccess") == "1") {
            JC_Utils.showToastSuccess("Your details have been updated!");
            localStorage.setItem("showUpdatedAccountDetailsSuccess", "0");
        }

        // Mark as initialised
        setInitialised(true);
    }, []);

    // - HANDLES - //

    // Account Details
    async function saveAccountDetails() {
        setSaveLoading(true);
        let newUser: UserModel = new UserModel({
            ...session.data!.user,
            FirstName: firstName,
            LastName: lastName,
            Phone: !JC_Utils.stringNullOrEmpty(phone) ? phone : undefined,
            CompanyName: !JC_Utils.stringNullOrEmpty(companyName) ? companyName : undefined,
            ABN: !JC_Utils.stringNullOrEmpty(abn) ? abn : undefined,
            LogoFileId: !JC_Utils.stringNullOrEmpty(logoFileId) ? logoFileId : undefined,
            Enable2fa: enable2fa
        });

        // If 2FA setting changed, update it separately
        if (enable2fa !== session.data!.user.Enable2fa) {
            await JC_PostRaw("user/toggle2FA", { userId: session.data!.user.Id, enable2fa });
        }
        // Update db User
        await JC_Post<UserModel>(UserModel, UserModel.apiRoute, newUser);
        // Trigger "jwt()" callback to refresh User from db
        await JC_Post<GlobalSettingsModel>(
            GlobalSettingsModel,
            GlobalSettingsModel.apiRoute,
            new GlobalSettingsModel({
                Code: "ForceRefreshAuthToken",
                Description: "",
                Value: "1"
            })
        );
        // Update the session with new data (need this plus the update in "jwt()" callback to get update showing properly)
        const newSession = session.data;
        newSession!.user = newUser as any;
        await session.update(newSession);
        // Show success toast immediately
        JC_Utils.showToastSuccess("Your details have been updated!");
        // Show success toast after refresh as backup
        localStorage.setItem("showUpdatedAccountDetailsSuccess", "1");
        // Refresh
        setTimeout(() => window.location.reload(), 100);
    }

    // Reset Password - Open Modal
    function resetPassword() {
        setPasswordModalOpen(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
        setPasswordChangeError("");
        setSubmitClicked(false);
    }

    // Change Password
    async function changePassword() {
        setSubmitClicked(true);
        setPasswordChangeLoading(true);
        setPasswordChangeError("");

        try {
            await JC_PostRaw("user/changePassword", {
                userId: session.data!.user.Id,
                currentPassword: currentPassword,
                newPassword: newPassword
            });

            setPasswordModalOpen(false);
            JC_Utils.showToastSuccess("Password changed successfully!");

            // Reset form
            setCurrentPassword("");
            setNewPassword("");
            setConfirmNewPassword("");
            setSubmitClicked(false);
        } catch (error: any) {
            setPasswordChangeError(error.error || "An error occurred while changing password.");
        }

        setPasswordChangeLoading(false);
    }

    // - BUILD - //

    // Account Details
    function _buildAccountDetails() {
        return (
            <div className={styles.accountDetailsContainer}>
                <JC_Form
                    onSubmit={saveAccountDetails}
                    isDisabled={confirmationLoading || logoutLoading}
                    isLoading={saveLoading}
                    fields={[
                        // Email
                        {
                            ...D_FieldModel_Email(),
                            overrideClass: styles.fieldOverride,
                            value: session.data!.user.Email,
                            readOnly: true
                        },
                        // First Name
                        {
                            ...D_FieldModel_FirstName(),
                            overrideClass: styles.fieldOverride,
                            value: firstName,
                            onChange: newValue => setFirstName(newValue)
                        },
                        // Last Name
                        {
                            ...D_FieldModel_LastName(),
                            overrideClass: styles.fieldOverride,
                            value: lastName,
                            onChange: newValue => setLastName(newValue)
                        },
                        // Company
                        {
                            ...D_FieldModel_Company(!JC_Utils.stringNullOrEmpty(companyName)),
                            overrideClass: styles.fieldOverride,
                            value: companyName,
                            onChange: newValue => setCompanyName(newValue)
                        },
                        // ABN
                        {
                            ...D_FieldModel_ABN(!JC_Utils.stringNullOrEmpty(abn)),
                            overrideClass: styles.fieldOverride,
                            value: abn,
                            onChange: newValue => setABN(newValue)
                        },
                        // Phone
                        {
                            ...D_FieldModel_Phone(!JC_Utils.stringNullOrEmpty(phone)),
                            overrideClass: styles.fieldOverride,
                            value: phone,
                            onChange: newValue => setPhone(newValue)
                        },
                        // Logo
                        {
                            inputId: "account-logo-input",
                            type: FieldTypeEnum.Custom,
                            overrideClass: styles.fieldOverride,
                            customNode: (
                                <div>
                                    <div
                                        style={{
                                            marginBottom: "6px",
                                            paddingLeft: "11px",
                                            textAlign: "left",
                                            fontSize: "16px",
                                            fontWeight: "bold"
                                        }}
                                    >
                                        Logo
                                    </div>
                                    <JC_PhotoUpload
                                        fileId={logoFileId}
                                        onImageUploaded={(fileId: string, _fileName: string) => {
                                            setLogoFileId(fileId);
                                        }}
                                        s3KeyPath="User/Logos"
                                    />
                                    {!JC_Utils.stringNullOrEmpty(logoFileId) && (
                                        <div style={{ marginTop: "10px", display: "flex", justifyContent: "center" }}>
                                            <JC_Button text="Clear Logo" onClick={() => setIsClearLogoConfirmModalOpen(true)} isSmall={true} />
                                        </div>
                                    )}
                                </div>
                            )
                        },
                        // Enable 2FA
                        {
                            inputId: "account-enable2fa-input",
                            type: FieldTypeEnum.Custom,
                            overrideClass: styles.fieldOverride,
                            customNode: (
                                <div>
                                    <div
                                        style={{
                                            marginBottom: "6px",
                                            paddingLeft: "11px",
                                            textAlign: "left",
                                            fontSize: "16px",
                                            fontWeight: "bold"
                                        }}
                                    >
                                        Two-Factor Authentication
                                    </div>
                                    <div style={{ paddingLeft: "11px" }}>
                                        <JC_Checkbox label="Enable Two-Factor Authentication" checked={enable2fa} onChange={() => setEnable2fa(!enable2fa)} />
                                        <div style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>When enabled, you&apos;ll need to enter a code sent to your email each time you log in.</div>
                                    </div>
                                </div>
                            )
                        }
                    ]}
                />

                {/* Action Buttons Container */}
                <div className={styles.actionButtonsContainer}>
                    {/* Reset Password */}
                    <JC_Button text="Reset Password" onClick={resetPassword} isDisabled={confirmationLoading || saveLoading || logoutLoading} />

                    {/* Logout */}
                    <JC_Button
                        text="Logout"
                        onClick={() => {
                            setLogoutLoading(true);
                            JC_Utils.clearAllLocalStorage();
                            signOut({ callbackUrl: "/login" });
                        }}
                        isDisabled={confirmationLoading || saveLoading}
                        isLoading={logoutLoading}
                    />
                </div>
            </div>
        );
    }

    // - Main - //

    return !initialised ? (
        <JC_Spinner isPageBody />
    ) : (
        <React.Fragment>
            {/* Main Container */}
            <div className={`${styles.mainContainer}`}>
                <JC_Title title="Account Details" />
                {_buildAccountDetails()}
            </div>

            {/* Confirmation */}
            {confirmationModalData && <JC_ModalConfirmation width={confirmationModalData.width} title={confirmationModalData.title} text={confirmationModalData.text} isOpen={confirmationModalData != null} onCancel={() => setConfirmationModalData(null)} submitButtons={confirmationModalData.submitButtons} isLoading={confirmationLoading} />}

            {/* Clear Logo Confirmation Modal */}
            <JC_ModalConfirmation
                title="Clear Logo"
                text="Are you sure you want to clear the logo?"
                isOpen={isClearLogoConfirmModalOpen}
                onCancel={() => setIsClearLogoConfirmModalOpen(false)}
                submitButtons={[
                    {
                        text: "Clear Logo",
                        onSubmit: () => {
                            setLogoFileId("");
                            setIsClearLogoConfirmModalOpen(false);
                        }
                    }
                ]}
            />

            {/* Password Change Modal */}
            <JC_Modal width="450px" title="Reset Password" isOpen={passwordModalOpen} onCancel={() => setPasswordModalOpen(false)}>
                <JC_Form
                    submitButtonText="Change Password"
                    onSubmit={changePassword}
                    isLoading={passwordChangeLoading}
                    errorMessage={passwordChangeError}
                    fields={[
                        // Current Password
                        {
                            inputId: "current-password-input",
                            type: FieldTypeEnum.Password,
                            label: "Current Password",
                            onChange: newValue => setCurrentPassword(newValue),
                            value: currentPassword,
                            validate: (v: any) => (JC_Utils.stringNullOrEmpty(v) ? "Enter your current password." : "")
                        },
                        // New Password
                        {
                            inputId: "new-password-input",
                            type: FieldTypeEnum.Password,
                            label: "New Password",
                            onChange: newValue => setNewPassword(newValue),
                            value: newPassword,
                            validate: (v: any) => (JC_Utils.stringNullOrEmpty(v) ? "Enter a password." : !JC_Utils_Validation.validPassword(v) ? "Password invalid." : "")
                        },
                        // Password Requirements
                        {
                            inputId: "password-requirements",
                            type: FieldTypeEnum.Custom,
                            customNode: <JC_PasswordRequirements key="password-requirements" password={newPassword} showErrors={submitClicked} />
                        },
                        // Confirm New Password
                        {
                            inputId: "confirm-new-password-input",
                            type: FieldTypeEnum.Password,
                            label: "Confirm New Password",
                            onChange: newValue => setConfirmNewPassword(newValue),
                            value: confirmNewPassword,
                            validate: (v: any) => (JC_Utils.stringNullOrEmpty(v) ? "Confirm the password." : confirmNewPassword !== newPassword ? "Passwords do not match" : "")
                        }
                    ]}
                />
            </JC_Modal>
        </React.Fragment>
    );
}
