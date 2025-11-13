"use client";

import { JC_Utils, JC_Utils_Validation } from "../../Utils";
import { JC_PostRaw } from "../../apiServices/JC_PostRaw";
import JC_Button from "../../components/JC_Button/JC_Button";
import JC_Checkbox from "../../components/JC_Checkbox/JC_Checkbox";
import JC_Field from "../../components/JC_Field/JC_Field";
import JC_Form from "../../components/JC_Form/JC_Form";
import JC_FormTablet, { JC_FormTabletModel } from "../../components/JC_FormTablet/JC_FormTablet";
import JC_Modal from "../../components/JC_Modal/JC_Modal";
import JC_ModalConfirmation from "../../components/JC_ModalConfirmation/JC_ModalConfirmation";
import JC_PasswordRequirements from "../../components/JC_PasswordRequirements/JC_PasswordRequirements";
import JC_PhotoUpload from "../../components/JC_PhotoUpload/JC_PhotoUpload";
import JC_Spinner from "../../components/JC_Spinner/JC_Spinner";
import { FieldTypeEnum } from "../../enums/FieldType";
import { LocalStorageKeyEnum } from "../../enums/LocalStorageKey";
import { D_FieldModel_ABN, D_FieldModel_Company, D_FieldModel_Email, D_FieldModel_FirstName, D_FieldModel_LastName, D_FieldModel_Phone } from "../../models/ComponentModels/JC_Field";
import { O_ReportTypeModel } from "../../models/O_ReportType";
import { UserModel } from "../../models/User";
import styles from "../page.module.scss";
import { useCallback, useEffect, useState } from "react";

interface UsersTabProps {
    reportTypeOptions: O_ReportTypeModel[];
}

export default function UsersTab({ reportTypeOptions }: UsersTabProps) {
    // - STATE - //
    const [initialised, setInitialised] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [users, setUsers] = useState<UserModel[]>([]);
    const [reportCounts, setReportCounts] = useState<Record<string, number>>({});
    const [qualificationCounts, setQualificationCounts] = useState<Record<string, number>>({});
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<UserModel | null>(null);
    const [selectedReportTypes, setSelectedReportTypes] = useState<string[]>([]);
    const [isQualificationsModalOpen, setIsQualificationsModalOpen] = useState<boolean>(false);
    const [isSavingQualifications, setIsSavingQualifications] = useState<boolean>(false);

    // Edit User fields state
    const [editFirstName, setEditFirstName] = useState<string>("");
    const [editLastName, setEditLastName] = useState<string>("");
    const [editPhone, setEditPhone] = useState<string>("");
    const [editCompanyName, setEditCompanyName] = useState<string>("");
    const [editABN, setEditABN] = useState<string>("");
    const [editLogoFileId, setEditLogoFileId] = useState<string>("");
    const [editEnable2fa, setEditEnable2fa] = useState<boolean>(false);
    const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);

    // Delete User State
    const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState<boolean>(false);
    const [isDeletingUser, setIsDeletingUser] = useState<boolean>(false);

    // Password change modal state
    const [passwordModalOpen, setPasswordModalOpen] = useState<boolean>(false);
    const [currentPassword, setCurrentPassword] = useState<string>("");
    const [newPassword, setNewPassword] = useState<string>("");
    const [confirmNewPassword, setConfirmNewPassword] = useState<string>("");
    const [passwordChangeLoading, setPasswordChangeLoading] = useState<boolean>(false);
    const [passwordChangeError, setPasswordChangeError] = useState<string>("");
    const [submitClicked, setSubmitClicked] = useState<boolean>(false);

    // Load users with report counts in a single optimized call
    const loadUsersWithReportCounts = useCallback(async () => {
        try {
            setIsLoading(true);

            // Single call to get users with report counts
            const usersWithCounts = await UserModel.GetEmployeeUsersForAdminWithReportCounts("ModifiedAt", false);

            // Convert to UserModel instances and extract counts
            const userList = usersWithCounts.map(u => new UserModel(u));
            const reportCountsMap: Record<string, number> = {};
            const qualificationCountsMap: Record<string, number> = {};

            usersWithCounts.forEach(u => {
                reportCountsMap[u.Id] = u.ReportCount;
                qualificationCountsMap[u.Id] = u.QualificationCount;
            });

            setUsers(userList);
            setReportCounts(reportCountsMap);
            setQualificationCounts(qualificationCountsMap);

            // Check if there's a selected user in localStorage
            const selectedSubUserId = localStorage.getItem(LocalStorageKeyEnum.JC_SelectedSubUserId);
            if (selectedSubUserId && userList.length > 0) {
                // Find the user in the loaded list
                const selectedUser = userList.find(u => u.Id === selectedSubUserId);
                if (selectedUser) {
                    // Check if this user exists and is not deleted
                    const userExists = await UserModel.ItemExists(selectedSubUserId);
                    if (userExists) {
                        // Load the full user data
                        const userData = await UserModel.Get(selectedSubUserId);
                        if (userData) {
                            setSelectedUser(userData);
                            setSelectedUserId(selectedSubUserId);
                            // Populate edit fields with selected user data
                            setEditFirstName(userData.FirstName);
                            setEditLastName(userData.LastName);
                            setEditPhone(userData.Phone || "");
                            setEditCompanyName(userData.CompanyName || "");
                            setEditABN(userData.ABN || "");
                            setEditLogoFileId(userData.LogoFileId || "");
                            setEditEnable2fa(userData.Enable2fa);
                        } else {
                            // User data not found, clear localStorage
                            localStorage.removeItem(LocalStorageKeyEnum.JC_SelectedSubUserId);
                            setSelectedUserId(null);
                        }
                    } else {
                        // User doesn't exist, clear localStorage
                        localStorage.removeItem(LocalStorageKeyEnum.JC_SelectedSubUserId);
                        setSelectedUserId(null);
                    }
                } else {
                    // User not in current list, clear localStorage
                    localStorage.removeItem(LocalStorageKeyEnum.JC_SelectedSubUserId);
                    setSelectedUserId(null);
                }
            }
        } catch (error) {
            console.error("Error loading users:", error);
            setUsers([]);
            setReportCounts({});
            setQualificationCounts({});
        } finally {
            setIsLoading(false);
            setInitialised(true);
        }
    }, []);

    // Load data on mount
    useEffect(() => {
        loadUsersWithReportCounts();
    }, [loadUsersWithReportCounts]);

    // - HANDLERS - //

    // Handle user tile click
    const handleUserClick = (user: UserModel) => {
        try {
            setSelectedUser(user);
            setSelectedUserId(user.Id);
            // Save selected user ID to localStorage
            localStorage.setItem(LocalStorageKeyEnum.JC_SelectedSubUserId, user.Id);
            // Clear selected customer when selecting a sub user
            localStorage.removeItem(LocalStorageKeyEnum.JC_SelectedCustomer);
            // Dispatch custom event to notify other components of the change
            window.dispatchEvent(new CustomEvent("localStorageChange"));
            // Populate edit fields with selected user data
            setEditFirstName(user.FirstName);
            setEditLastName(user.LastName);
            setEditPhone(user.Phone || "");
            setEditCompanyName(user.CompanyName || "");
            setEditABN(user.ABN || "");
            setEditLogoFileId(user.LogoFileId || "");
            setEditEnable2fa(user.Enable2fa);
        } catch (error) {
            console.error("Error selecting user:", error);
        }
    };

    const handleEditQualificationsClick = () => {
        if (selectedUser) {
            // Parse existing qualifications
            const existingCodes = selectedUser.ReportTypeListJson ? JSON.parse(selectedUser.ReportTypeListJson) : [];
            setSelectedReportTypes(existingCodes);
            setIsQualificationsModalOpen(true);
        }
    };

    const handleQualificationToggle = useCallback((code: string) => {
        setSelectedReportTypes(prev => (prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]));
    }, []);

    const handleSelectAllQualifications = useCallback(() => {
        const allSelected = selectedReportTypes.length === reportTypeOptions.length;
        if (allSelected) {
            // Select none
            setSelectedReportTypes([]);
        } else {
            // Select all
            setSelectedReportTypes(reportTypeOptions.map(option => option.Code));
        }
    }, [selectedReportTypes.length, reportTypeOptions]);

    const handleSaveQualifications = useCallback(async () => {
        if (!selectedUser) return;

        setIsSavingQualifications(true);
        try {
            const updatedUser = { ...selectedUser };
            updatedUser.ReportTypeListJson = JSON.stringify(selectedReportTypes);
            await UserModel.Update(updatedUser);
            setIsQualificationsModalOpen(false);

            // Update the user in the local list
            setUsers(prevUsers => prevUsers.map(user => (user.Id === selectedUser.Id ? new UserModel({ ...user, ReportTypeListJson: JSON.stringify(selectedReportTypes) }) : user)));

            // Update selected user
            setSelectedUser(new UserModel({ ...selectedUser, ReportTypeListJson: JSON.stringify(selectedReportTypes) }));

            // Update qualification count in the qualificationCounts state
            setQualificationCounts(prevCounts => ({
                ...prevCounts,
                [selectedUser.Id]: selectedReportTypes.length
            }));

            JC_Utils.showToastSuccess("Qualifications updated successfully!");
        } catch (error) {
            console.error("Error saving qualifications:", error);
            JC_Utils.showToastError("Failed to update qualifications.");
        } finally {
            setIsSavingQualifications(false);
        }
    }, [selectedUser, selectedReportTypes]);

    const handleSaveEditUser = useCallback(async () => {
        if (!selectedUser) return;

        setIsSavingEdit(true);
        try {
            const updatedUser: UserModel = new UserModel({
                ...selectedUser,
                FirstName: editFirstName,
                LastName: editLastName,
                Phone: !JC_Utils.stringNullOrEmpty(editPhone) ? editPhone : undefined,
                CompanyName: !JC_Utils.stringNullOrEmpty(editCompanyName) ? editCompanyName : undefined,
                ABN: !JC_Utils.stringNullOrEmpty(editABN) ? editABN : undefined,
                LogoFileId: !JC_Utils.stringNullOrEmpty(editLogoFileId) ? editLogoFileId : undefined,
                Enable2fa: editEnable2fa
            });

            await UserModel.Update(updatedUser);
            JC_Utils.showToastSuccess("User updated successfully!");

            // Update the user in the local list
            setUsers(prevUsers => prevUsers.map(user => (user.Id === selectedUser.Id ? updatedUser : user)));

            // Update selected user
            setSelectedUser(updatedUser);
        } catch (error) {
            console.error("Error updating user:", error);
            JC_Utils.showToastError("Failed to update user. Please try again.");
        } finally {
            setIsSavingEdit(false);
        }
    }, [selectedUser, editFirstName, editLastName, editPhone, editCompanyName, editABN, editLogoFileId, editEnable2fa]);

    const handleDeleteUser = useCallback(async () => {
        if (!selectedUser) return;

        setIsDeletingUser(true);
        try {
            await UserModel.Delete(selectedUser.Id);
            JC_Utils.showToastSuccess("User deleted successfully!");
            setIsDeleteConfirmModalOpen(false);

            // Remove user from local list
            setUsers(prevUsers => prevUsers.filter(user => user.Id !== selectedUser.Id));

            // Clear selection
            setSelectedUser(null);
            setSelectedUserId(null);
            localStorage.removeItem(LocalStorageKeyEnum.JC_SelectedSubUserId);
            // Dispatch custom event to notify other components of the change
            window.dispatchEvent(new CustomEvent("localStorageChange"));
        } catch (error) {
            console.error("Error deleting user:", error);
            JC_Utils.showToastError("Failed to delete user. Please try again.");
        } finally {
            setIsDeletingUser(false);
        }
    }, [selectedUser]);

    // Reset Password - Open Modal
    const resetPassword = useCallback(() => {
        setPasswordModalOpen(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
        setPasswordChangeError("");
        setSubmitClicked(false);
    }, []);

    // Change Password
    const changePassword = useCallback(async () => {
        if (!selectedUser) return;

        setSubmitClicked(true);
        setPasswordChangeLoading(true);
        setPasswordChangeError("");

        try {
            await JC_PostRaw("user/changePassword", {
                userId: selectedUser.Id,
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
    }, [selectedUser, currentPassword, newPassword]);

    // Create the form tablet model
    const formTabletModel: JC_FormTabletModel = {
        headerLabel: "",
        fieldsPaneHeader: selectedUser ? `${selectedUser.FirstName} ${selectedUser.LastName}`.trim() : "-",
        panesSwitched: true,
        inputPaneWidth: 450,
        noSelectionViewOverride: (
            <div className={styles.reportsContainer}>
                <div className={styles.reportsList}>
                    {users.length === 0 ? (
                        <div className={styles.noReports}>No sub-users found</div>
                    ) : (
                        users.map(user => (
                            <div key={user.Id} className={`${styles.reportTile} ${selectedUserId === user.Id ? styles.selectedTile : ""}`} onClick={() => handleUserClick(user)}>
                                <div className={styles.reportContent}>
                                    <div className={styles.reportAddress}>{`${user.FirstName} ${user.LastName}`.trim()}</div>
                                    <div className={styles.reportDefects}>
                                        {(() => {
                                            const qualificationsCount = qualificationCounts[user.Id] || 0;
                                            const reportsCount = reportCounts[user.Id] || 0;
                                            const qualificationsText = qualificationsCount === 1 ? "1 Qualification" : `${qualificationsCount} Qualifications`;
                                            const reportsText = reportsCount === 1 ? "1 Report" : `${reportsCount} Reports`;
                                            return `${qualificationsText} | ${reportsText}`;
                                        })()}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        ),
        noSelectionHeaderOverride: "Select a Sub-User",
        fieldsCustomNode: selectedUser ? (
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", maxWidth: "500px", width: "100%", height: "max-content" }}>
                {/* User Header */}
                <div style={{ marginBottom: "20px", fontSize: "18px", fontWeight: "bold", textAlign: "center" }}>{`${selectedUser.FirstName} ${selectedUser.LastName}`.trim()}</div>

                {/* Reset Password Button */}
                <div style={{ marginTop: "10px", marginBottom: "10px", width: "100%", display: "flex", justifyContent: "center" }}>
                    <JC_Button text="Reset Password" onClick={resetPassword} isDisabled={isSavingEdit || isDeletingUser || passwordChangeLoading} overrideClass={styles.resetPasswordButton} />
                </div>

                {/* Edit Qualifications Button */}
                <div style={{ marginTop: "10px", marginBottom: "10px", width: "100%", display: "flex", justifyContent: "center" }}>
                    <JC_Button text="Edit Qualifications" onClick={handleEditQualificationsClick} isDisabled={isSavingEdit || isDeletingUser} />
                </div>

                <div style={{ marginBottom: "15px", width: "100%" }}>
                    <JC_Field {...D_FieldModel_Email()} value={selectedUser.Email || ""} readOnly={true} />
                </div>
                <div style={{ marginBottom: "15px", width: "100%" }}>
                    <JC_Field {...D_FieldModel_FirstName()} value={editFirstName} onChange={newValue => setEditFirstName(newValue)} />
                </div>
                <div style={{ marginBottom: "15px", width: "100%" }}>
                    <JC_Field {...D_FieldModel_LastName()} value={editLastName} onChange={newValue => setEditLastName(newValue)} />
                </div>
                <div style={{ marginBottom: "15px", width: "100%" }}>
                    <JC_Field {...D_FieldModel_Company(!JC_Utils.stringNullOrEmpty(editCompanyName))} value={editCompanyName} onChange={newValue => setEditCompanyName(newValue)} />
                </div>
                <div style={{ marginBottom: "15px", width: "100%" }}>
                    <JC_Field {...D_FieldModel_ABN(!JC_Utils.stringNullOrEmpty(editABN))} value={editABN} onChange={newValue => setEditABN(newValue)} />
                </div>
                <div style={{ marginBottom: "15px", width: "100%" }}>
                    <JC_Field {...D_FieldModel_Phone(!JC_Utils.stringNullOrEmpty(editPhone))} value={editPhone} onChange={newValue => setEditPhone(newValue)} />
                </div>

                {/* Logo Field */}
                <div style={{ width: "100%", marginBottom: "26px" }}>
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
                        fileId={editLogoFileId}
                        onImageUploaded={(fileId: string, _fileName: string) => {
                            setEditLogoFileId(fileId);
                        }}
                        s3KeyPath="User/Logos"
                        targetUserId={selectedUser.Id}
                    />
                </div>

                {/* Two-Factor Authentication Field */}
                <div style={{ width: "100%", marginBottom: "26px" }}>
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
                        <JC_Checkbox label="Enable Two-Factor Authentication" checked={editEnable2fa} onChange={() => setEditEnable2fa(!editEnable2fa)} />
                        <div style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>When enabled, you&apos;ll need to enter a code sent to your email each time you log in.</div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className={styles.editUserModalButtons}>
                    <JC_Button text="Delete" onClick={() => setIsDeleteConfirmModalOpen(true)} isDisabled={isSavingEdit || isDeletingUser} overrideClass={styles.errorButton} />
                    <JC_Button text="Save Changes" onClick={handleSaveEditUser} isLoading={isSavingEdit} isDisabled={isDeletingUser} />
                </div>
            </div>
        ) : undefined,
        sections: [],
        isLoading: isLoading,
        showSaveButton: false,
        hideHeader: true
    };

    // - RENDER - //

    if (!initialised) {
        return <JC_Spinner />;
    }

    return (
        <>
            <JC_FormTablet model={formTabletModel} />

            {/* Qualifications Modal */}
            <JC_Modal
                isOpen={isQualificationsModalOpen}
                onCancel={() => {
                    // Don't allow cancel during loading
                    if (isSavingQualifications) return;
                    setIsQualificationsModalOpen(false);
                }}
                title="Edit Qualifications"
            >
                <div>
                    {/* Select All/None Button */}
                    <div className={styles.selectAllContainer}>
                        <JC_Button text={selectedReportTypes.length === reportTypeOptions.length ? "Select None" : "Select All"} onClick={handleSelectAllQualifications} isSmall={true} isDisabled={isSavingQualifications} />
                    </div>

                    <div className={styles.qualificationsContainer}>
                        {reportTypeOptions.map(option => (
                            <div key={option.Code} className={`${styles.qualificationTile} ${selectedReportTypes.includes(option.Code) ? styles.selected : ""} ${isSavingQualifications ? styles.disabled : ""}`} onClick={isSavingQualifications ? undefined : () => handleQualificationToggle(option.Code)}>
                                {option.Name}
                            </div>
                        ))}
                    </div>
                    <div className={styles.modalButtonsContainer}>
                        <JC_Button text="Cancel" onClick={() => setIsQualificationsModalOpen(false)} isDisabled={isSavingQualifications} />
                        <JC_Button text="Save" onClick={handleSaveQualifications} isLoading={isSavingQualifications} />
                    </div>
                </div>
            </JC_Modal>

            {/* Delete Confirmation Modal */}
            <JC_ModalConfirmation
                title="Delete User"
                text={`Are you sure you want to delete ${selectedUser?.FirstName} ${selectedUser?.LastName}? This action cannot be undone.`}
                isOpen={isDeleteConfirmModalOpen}
                onCancel={() => setIsDeleteConfirmModalOpen(false)}
                submitButtons={[
                    {
                        text: "Delete User",
                        onSubmit: handleDeleteUser
                    }
                ]}
                isLoading={isDeletingUser}
            />

            {/* Password Change Modal */}
            <JC_Modal width="450px" title="Change Password" isOpen={passwordModalOpen} onCancel={() => setPasswordModalOpen(false)}>
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
        </>
    );
}
