"use client";

import { JC_Utils } from "../../Utils";
import JC_Button from "../../components/JC_Button/JC_Button";
import JC_List from "../../components/JC_List/JC_List";
import { JC_ListHeader } from "../../components/JC_List/JC_ListHeader";
import JC_Modal from "../../components/JC_Modal/JC_Modal";
import { O_ReportTypeModel } from "../../models/O_ReportType";
import { UserModel } from "../../models/User";
import styles from "../page.module.scss";
import { useState, useEffect, useCallback, useMemo } from "react";

interface UsersTabProps {
    reportTypeOptions: O_ReportTypeModel[];
}

export default function UsersTab({ reportTypeOptions }: UsersTabProps) {
    // - STATE - //
    const [isQualificationsModalOpen, setIsQualificationsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserModel | null>(null);
    const [selectedReportTypes, setSelectedReportTypes] = useState<string[]>([]);
    const [isSavingQualifications, setIsSavingQualifications] = useState(false);

    // - HANDLERS - //

    const handleUserRowClick = useCallback(async (user: UserModel) => {
        setSelectedUser(user);
        // Parse existing qualifications
        const existingCodes = user.ReportTypeListJson ? JSON.parse(user.ReportTypeListJson) : [];
        setSelectedReportTypes(existingCodes);
        setIsQualificationsModalOpen(true);
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

    // - RENDER - //

    // Memoize headers to prevent re-creation on every render
    const headers = useMemo<JC_ListHeader[]>(
        () => [
            { label: "Name", sortKey: "FirstName" },
            { label: "Qualifications", sortKey: "ReportTypeListJson" }
        ],
        []
    );

    return (
        <>
            <JC_List<UserModel>
                service={UserModel.GetEmployeeUsersForAdmin}
                headers={headers}
                defaultSortKey="FirstName"
                defaultSortAsc={true}
                row={useCallback(
                    (user: UserModel) => (
                        <tr key={user.Id} onClick={() => handleUserRowClick(user)} style={{ cursor: "pointer" }}>
                            <td>{`${user.FirstName} ${user.LastName || ""}`.trim()}</td>
                            <td>{user.Ex_ReportTypeCodesList ? user.Ex_ReportTypeCodesList.length : 0}</td>
                        </tr>
                    ),
                    [handleUserRowClick]
                )}
            />

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
        </>
    );
}
