"use client";

import { JC_Utils, JC_Utils_Validation } from "../../Utils";
import { JC_PostRaw } from "../../apiServices/JC_PostRaw";
import JC_Button from "../../components/JC_Button/JC_Button";
import JC_Checkbox from "../../components/JC_Checkbox/JC_Checkbox";
import JC_Field from "../../components/JC_Field/JC_Field";
import JC_Form from "../../components/JC_Form/JC_Form";
import JC_List from "../../components/JC_List/JC_List";
import { JC_ListHeader } from "../../components/JC_List/JC_ListHeader";
import JC_Modal from "../../components/JC_Modal/JC_Modal";
import JC_ModalConfirmation from "../../components/JC_ModalConfirmation/JC_ModalConfirmation";
import JC_PasswordRequirements from "../../components/JC_PasswordRequirements/JC_PasswordRequirements";
import JC_PhotoUpload from "../../components/JC_PhotoUpload/JC_PhotoUpload";
import { FieldTypeEnum } from "../../enums/FieldType";
import { D_FieldModel_ABN, D_FieldModel_Company, D_FieldModel_Email, D_FieldModel_FirstName, D_FieldModel_LastName, D_FieldModel_Phone } from "../../models/ComponentModels/JC_Field";
import { O_ReportTypeModel } from "../../models/O_ReportType";
import { UserModel } from "../../models/User";
import styles from "../page.module.scss";
import Image from "next/image";
import React, { useCallback, useMemo, useState } from "react";

interface UsersTabProps {
    reportTypeOptions: O_ReportTypeModel[];
}

// Memoized Users List Component to prevent re-renders during form interactions
const MemoizedUsersList = React.memo<{
    refreshKey: number;
    onUserRowClick: (user: UserModel) => void;
    onEditUserClick: (user: UserModel, event: React.MouseEvent) => void;
}>(({ refreshKey, onUserRowClick, onEditUserClick }) => {
    const headers = useMemo<JC_ListHeader[]>(
        () => [
            { label: "Name", sortKey: "FirstName" },
            { label: "Qualifications", sortKey: "ReportTypeListJson" },
            { label: "", sortKey: "Id" } // Empty header for edit column
        ],
        []
    );

    const userService = useMemo(() => UserModel.GetEmployeeUsersForAdmin, []);
    const defaultSortKey = useMemo(() => "FirstName", []);
    const defaultSortAsc = useMemo(() => true, []);

    const renderUserRow = useCallback(
        (user: UserModel) => (
            <tr key={user.Id} onClick={() => onUserRowClick(user)} style={{ cursor: "pointer" }}>
                <td>{`${user.FirstName} ${user.LastName || ""}`.trim()}</td>
                <td>{user.Ex_ReportTypeCodesList ? user.Ex_ReportTypeCodesList.length : 0}</td>
                <td
                    style={{
                        textAlign: "center",
                        cursor: "pointer",
                        padding: "8px",
                        transition: "background-color 0.2s ease"
                    }}
                    onClick={e => onEditUserClick(user, e)}
                    onMouseEnter={e => {
                        (e.target as HTMLElement).style.backgroundColor = "rgba(0, 0, 0, 0.1)";
                    }}
                    onMouseLeave={e => {
                        (e.target as HTMLElement).style.backgroundColor = "transparent";
                    }}
                >
                    <Image src="/icons/Pencil.webp" alt="Edit" width={16} height={16} unoptimized style={{ marginTop: "4px", marginBottom: "-2px" }} />
                </td>
            </tr>
        ),
        [onUserRowClick, onEditUserClick]
    );

    return <JC_List<UserModel> key={refreshKey} service={userService} headers={headers} defaultSortKey={defaultSortKey} defaultSortAsc={defaultSortAsc} row={renderUserRow} />;
});

MemoizedUsersList.displayName = "MemoizedUsersList";

export default function UsersTab({ reportTypeOptions }: UsersTabProps) {
    // - STATE - //
    const [isQualificationsModalOpen, setIsQualificationsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserModel | null>(null);
    const [selectedReportTypes, setSelectedReportTypes] = useState<string[]>([]);
    const [isSavingQualifications, setIsSavingQualifications] = useState(false);

    // Edit User Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editUser, setEditUser] = useState<UserModel | null>(null);
    const [editFirstName, setEditFirstName] = useState<string>("");
    const [editLastName, setEditLastName] = useState<string>("");
    const [editPhone, setEditPhone] = useState<string>("");
    const [editCompanyName, setEditCompanyName] = useState<string>("");
    const [editABN, setEditABN] = useState<string>("");
    const [editLogoFileId, setEditLogoFileId] = useState<string>("");
    const [editEnable2fa, setEditEnable2fa] = useState<boolean>(false);
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const [listRefreshKey, setListRefreshKey] = useState(0);
    const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
    const [isDeletingUser, setIsDeletingUser] = useState(false);

    // Password change modal state
    const [passwordModalOpen, setPasswordModalOpen] = useState<boolean>(false);
    const [currentPassword, setCurrentPassword] = useState<string>("");
    const [newPassword, setNewPassword] = useState<string>("");
    const [confirmNewPassword, setConfirmNewPassword] = useState<string>("");
    const [passwordChangeLoading, setPasswordChangeLoading] = useState<boolean>(false);
    const [passwordChangeError, setPasswordChangeError] = useState<string>("");
    const [submitClicked, setSubmitClicked] = useState<boolean>(false);

    // - HANDLERS - //

    const handleUserRowClick = useCallback(async (user: UserModel) => {
        setSelectedUser(user);
        // Parse existing qualifications
        const existingCodes = user.ReportTypeListJson ? JSON.parse(user.ReportTypeListJson) : [];
        setSelectedReportTypes(existingCodes);
        setIsQualificationsModalOpen(true);
    }, []);

    const handleEditUserClick = useCallback((user: UserModel, event: React.MouseEvent) => {
        event.stopPropagation(); // Prevent row click
        setEditUser(user);
        setEditFirstName(user.FirstName);
        setEditLastName(user.LastName);
        setEditPhone(user.Phone || "");
        setEditCompanyName(user.CompanyName || "");
        setEditABN(user.ABN || "");
        setEditLogoFileId(user.LogoFileId || "");
        setEditEnable2fa(user.Enable2fa);
        setIsEditModalOpen(true);
    }, []);

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
            setSelectedUser(null);
            JC_Utils.showToastSuccess("Qualifications updated successfully!");
        } catch (error) {
            console.error("Error saving qualifications:", error);
            JC_Utils.showToastError("Failed to update qualifications.");
        } finally {
            setIsSavingQualifications(false);
        }
    }, [selectedUser, selectedReportTypes]);

    const handleSaveEditUser = useCallback(async () => {
        if (!editUser) return;

        setIsSavingEdit(true);
        try {
            const updatedUser: UserModel = new UserModel({
                ...editUser,
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
            setIsEditModalOpen(false);

            // Refresh the list by incrementing the refresh key
            setListRefreshKey(prev => prev + 1);
        } catch (error) {
            console.error("Error updating user:", error);
            JC_Utils.showToastError("Failed to update user. Please try again.");
        } finally {
            setIsSavingEdit(false);
        }
    }, [editUser, editFirstName, editLastName, editPhone, editCompanyName, editABN, editLogoFileId, editEnable2fa]);

    const handleDeleteUser = useCallback(async () => {
        if (!editUser) return;

        setIsDeletingUser(true);
        try {
            await UserModel.Delete(editUser.Id);
            JC_Utils.showToastSuccess("User deleted successfully!");
            setIsDeleteConfirmModalOpen(false);
            setIsEditModalOpen(false);
            setListRefreshKey(prev => prev + 1); // Trigger list refresh
        } catch (error) {
            console.error("Error deleting user:", error);
            JC_Utils.showToastError("Failed to delete user. Please try again.");
        } finally {
            setIsDeletingUser(false);
        }
    }, [editUser]);

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
        if (!editUser) return;

        setSubmitClicked(true);
        setPasswordChangeLoading(true);
        setPasswordChangeError("");

        try {
            await JC_PostRaw("user/changePassword", {
                userId: editUser.Id,
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
    }, [editUser, currentPassword, newPassword]);

    // - RENDER - //

    return (
        <>
            <MemoizedUsersList refreshKey={listRefreshKey} onUserRowClick={handleUserRowClick} onEditUserClick={handleEditUserClick} />

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

            {/* Edit User Modal */}
            <JC_Modal
                isOpen={isEditModalOpen}
                onCancel={() => {
                    // Don't allow cancel during loading
                    if (isSavingEdit || isDeletingUser) return;
                    setIsEditModalOpen(false);
                }}
                title="Edit User"
                width="450px"
                overrideClass={styles.editUserModal}
            >
                <div className={styles.editUserModalContent}>
                    <div className={styles.editUserModalScrollableContent}>
                        {/* Reset Password Button */}
                        <JC_Button text="Reset Password" onClick={resetPassword} isDisabled={isSavingEdit || isDeletingUser || passwordChangeLoading} overrideClass={styles.resetPasswordButton} />

                        <JC_Field {...D_FieldModel_Email()} value={editUser?.Email || ""} readOnly={true} />
                        <JC_Field {...D_FieldModel_FirstName()} value={editFirstName} onChange={newValue => setEditFirstName(newValue)} />
                        <JC_Field {...D_FieldModel_LastName()} value={editLastName} onChange={newValue => setEditLastName(newValue)} />
                        <JC_Field {...D_FieldModel_Company(!JC_Utils.stringNullOrEmpty(editCompanyName))} value={editCompanyName} onChange={newValue => setEditCompanyName(newValue)} />
                        <JC_Field {...D_FieldModel_ABN(!JC_Utils.stringNullOrEmpty(editABN))} value={editABN} onChange={newValue => setEditABN(newValue)} />
                        <JC_Field {...D_FieldModel_Phone(!JC_Utils.stringNullOrEmpty(editPhone))} value={editPhone} onChange={newValue => setEditPhone(newValue)} />

                        {/* Logo Field */}
                        <div style={{ width: "100%" }}>
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
                                targetUserId={editUser?.Id}
                            />
                        </div>

                        {/* Two-Factor Authentication Field */}
                        <div style={{ width: "100%" }}>
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
                    </div>

                    {/* Custom Button Row */}
                    <div className={styles.editUserModalButtons}>
                        <JC_Button text="Delete" onClick={() => setIsDeleteConfirmModalOpen(true)} isDisabled={isSavingEdit || isDeletingUser} overrideClass={styles.errorButton} />
                        <JC_Button text="Save Changes" onClick={handleSaveEditUser} isLoading={isSavingEdit} isDisabled={isDeletingUser} />
                    </div>
                </div>
            </JC_Modal>

            {/* Delete Confirmation Modal */}
            <JC_ModalConfirmation
                title="Delete User"
                text={`Are you sure you want to delete ${editUser?.FirstName} ${editUser?.LastName}? This action cannot be undone.`}
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
