"use client";

import { JC_Utils, JC_Utils_Validation } from "../../Utils";
import { JC_PutRaw } from "../../apiServices/JC_PutRaw";
import JC_Button from "../../components/JC_Button/JC_Button";
import JC_Checkbox from "../../components/JC_Checkbox/JC_Checkbox";
import JC_Form from "../../components/JC_Form/JC_Form";
import JC_Modal from "../../components/JC_Modal/JC_Modal";
import JC_PasswordRequirements from "../../components/JC_PasswordRequirements/JC_PasswordRequirements";
import JC_PhotoUpload from "../../components/JC_PhotoUpload/JC_PhotoUpload";
import { FieldTypeEnum } from "../../enums/FieldType";
import { D_FieldModel_ABN, D_FieldModel_Company, D_FieldModel_Email, D_FieldModel_FirstName, D_FieldModel_LastName, D_FieldModel_Phone } from "../../models/ComponentModels/JC_Field";
import { O_ReportTypeModel } from "../../models/O_ReportType";
import { UserModel } from "../../models/User";
import styles from "../page.module.scss";
import { useCallback, useEffect, useState } from "react";

export default function RegisterTab() {
    // - STATE - //
    const [isRegisterLoading, setIsRegisterLoading] = useState<boolean>(false);
    const [registerErrorMessage, setRegisterErrorMessage] = useState<string>("");
    const [registerSubmitClicked, setRegisterSubmitClicked] = useState<boolean>(false);
    const [registerFirstName, setRegisterFirstName] = useState<string>("");
    const [registerLastName, setRegisterLastName] = useState<string>("");
    const [registerEmail, setRegisterEmail] = useState<string>("");
    const [registerPhone, setRegisterPhone] = useState<string>();
    const [registerCompanyName, setRegisterCompanyName] = useState<string>();
    const [registerABN, setRegisterABN] = useState<string>();
    const [registerLogoFileId, setRegisterLogoFileId] = useState<string>("");
    const [registerPassword, setRegisterPassword] = useState<string>("");
    const [registerConfirmPassword, setRegisterConfirmPassword] = useState<string>("");
    const [isAdminChecked, setIsAdminChecked] = useState<boolean>(false);
    const [selectedEmployeeUser, setSelectedEmployeeUser] = useState<UserModel | null>(null);
    const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState<boolean>(false);
    const [allAdminUsers, setAllAdminUsers] = useState<UserModel[]>([]);

    // Qualifications modal state
    const [isQualificationsModalOpen, setIsQualificationsModalOpen] = useState<boolean>(false);
    const [selectedReportTypes, setSelectedReportTypes] = useState<string[]>([]);
    const [reportTypeOptions, setReportTypeOptions] = useState<O_ReportTypeModel[]>([]);

    // - EFFECTS - //

    useEffect(() => {
        const loadData = async () => {
            try {
                // Load admin users
                const adminUsers = await UserModel.GetAdminUsers();
                setAllAdminUsers(adminUsers.ResultList || []);

                // Load report type options for qualifications
                const reportTypes = await O_ReportTypeModel.GetList();
                setReportTypeOptions(reportTypes.ResultList || []);
            } catch (error) {
                console.error("Error loading data:", error);
            }
        };
        loadData();
    }, []);

    // - HANDLERS - //

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

    const handleRegister = async () => {
        setRegisterSubmitClicked(true);
        setIsRegisterLoading(true);
        setRegisterErrorMessage("");

        try {
            let newUser: UserModel = new UserModel({
                FirstName: registerFirstName,
                LastName: registerLastName,
                Email: registerEmail.toLowerCase(),
                Phone: registerPhone,
                CompanyName: registerCompanyName,
                ABN: registerABN,
                LogoFileId: registerLogoFileId || undefined,
                ReportTypeListJson: selectedReportTypes.length > 0 ? JSON.stringify(selectedReportTypes) : undefined,
                EmployeeOfUserId: isAdminChecked ? undefined : selectedEmployeeUser ? selectedEmployeeUser.Id : undefined
            });

            // Create User
            await JC_PutRaw<{ userData: UserModel; password: string }>(UserModel.apiRoute, { userData: newUser, password: registerPassword }, undefined, "User");

            // Clear form
            setRegisterFirstName("");
            setRegisterLastName("");
            setRegisterEmail("");
            setRegisterPhone(undefined);
            setRegisterCompanyName(undefined);
            setRegisterABN(undefined);
            setRegisterLogoFileId("");
            setSelectedReportTypes([]);
            setRegisterPassword("");
            setRegisterConfirmPassword("");
            setIsAdminChecked(false);
            setSelectedEmployeeUser(null);
            setRegisterSubmitClicked(false);

            JC_Utils.showToastSuccess("User registered successfully!");
        } catch (error) {
            setRegisterErrorMessage((error as { message: string }).message);
        } finally {
            setIsRegisterLoading(false);
        }
    };

    const handleEmployeeSelection = (user: UserModel) => {
        setSelectedEmployeeUser(user);
        setIsEmployeeModalOpen(false);
    };

    const handleAdminCheckboxChange = () => {
        const newValue = !isAdminChecked;
        setIsAdminChecked(newValue);
        if (newValue) {
            // If checking admin (making them an admin), clear the employee selection
            setSelectedEmployeeUser(null);
        }
    };

    // - RENDER - //

    return (
        <>
            <div className={styles.registerContainer}>
                <JC_Form
                    key={registerErrorMessage}
                    submitButtonText="Register"
                    onSubmit={handleRegister}
                    isLoading={isRegisterLoading}
                    errorMessage={registerErrorMessage}
                    fields={[
                        // First Name
                        {
                            ...D_FieldModel_FirstName(),
                            inputId: "register-first-input",
                            onChange: newValue => setRegisterFirstName(newValue),
                            value: registerFirstName
                        },
                        // Last Name
                        {
                            ...D_FieldModel_LastName(),
                            inputId: "register-last-name-input",
                            onChange: newValue => setRegisterLastName(newValue),
                            value: registerLastName
                        },
                        // Company
                        {
                            ...D_FieldModel_Company(),
                            inputId: "register-company-input",
                            onChange: newValue => setRegisterCompanyName(newValue),
                            value: registerCompanyName
                        },
                        // ABN
                        {
                            ...D_FieldModel_ABN(),
                            inputId: "register-abn-input",
                            onChange: newValue => setRegisterABN(newValue),
                            value: registerABN
                        },
                        // Email
                        {
                            ...D_FieldModel_Email(),
                            inputId: "register-email-input",
                            onChange: newValue => setRegisterEmail(newValue),
                            value: registerEmail
                        },
                        // Phone
                        {
                            ...D_FieldModel_Phone(),
                            inputId: "register-phone-input",
                            onChange: newValue => setRegisterPhone(newValue),
                            value: registerPhone
                        },
                        // Logo
                        {
                            inputId: "register-logo-input",
                            type: FieldTypeEnum.Custom,
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
                                        fileId={registerLogoFileId}
                                        onImageUploaded={(fileId: string, _fileName: string) => {
                                            setRegisterLogoFileId(fileId);
                                        }}
                                        s3KeyPath="User/Logos"
                                    />
                                </div>
                            )
                        },

                        // Password
                        {
                            inputId: "register-password-input",
                            type: FieldTypeEnum.Password,
                            label: "Password",
                            onChange: newValue => setRegisterPassword(newValue),
                            value: registerPassword,
                            validate: (v: any) => (JC_Utils.stringNullOrEmpty(v) ? "Enter a password." : !JC_Utils_Validation.validPassword(v) ? `Password invalid.` : "")
                        },
                        // Password Requirements
                        {
                            overrideClass: styles.passwordRequirementsField,
                            inputId: "password-requirements",
                            type: FieldTypeEnum.Custom,
                            customNode: <JC_PasswordRequirements key="password-requirements" password={registerPassword} showErrors={registerSubmitClicked} />
                        },
                        // Confirm Password
                        {
                            inputId: "register-confirm-password-input",
                            type: FieldTypeEnum.Password,
                            label: "Confirm Password",
                            onChange: newValue => setRegisterConfirmPassword(newValue),
                            value: registerConfirmPassword,
                            validate: (v: any) => (JC_Utils.stringNullOrEmpty(v) ? "Confirm the password." : registerConfirmPassword != registerPassword ? "Passwords do not match" : "")
                        },
                        // Admin User, Employee Of, and Qualifications - Grouped in shared container
                        {
                            inputId: "user-role-container",
                            type: FieldTypeEnum.Custom,
                            validate: () => (!isAdminChecked && !selectedEmployeeUser ? "Please select which admin this user is an employee of." : ""),
                            customNode: (
                                <div key="user-role-container" className={styles.userRoleContainer}>
                                    {/* Admin User Checkbox */}
                                    <div className={styles.adminUserSection}>
                                        <JC_Checkbox label="Admin User" checked={isAdminChecked} onChange={handleAdminCheckboxChange} />
                                    </div>

                                    {/* Employee Of Selection (only show if admin is NOT checked) */}
                                    {!isAdminChecked && (
                                        <div className={styles.employeeSelectionContainer}>
                                            <div className={styles.employeeSelectionLabel}>Employee of</div>
                                            <button type="button" onClick={() => setIsEmployeeModalOpen(true)} className={styles.employeeSelectionButton}>
                                                <span className={styles.buttonText}>{selectedEmployeeUser ? `${selectedEmployeeUser.FirstName} ${selectedEmployeeUser.LastName}` : "-"}</span>
                                            </button>
                                        </div>
                                    )}

                                    {/* Qualifications Selection (only show if admin is NOT checked) */}
                                    {!isAdminChecked && (
                                        <div className={styles.employeeSelectionContainer}>
                                            <div className={styles.employeeSelectionLabel}>Qualifications</div>
                                            <button type="button" onClick={() => setIsQualificationsModalOpen(true)} className={styles.employeeSelectionButton}>
                                                <span className={styles.buttonText}>{selectedReportTypes.length > 0 ? `${selectedReportTypes.length} Selections` : "-"}</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )
                        }
                    ]}
                />
            </div>

            {/* Employee Selection Modal */}
            <JC_Modal isOpen={isEmployeeModalOpen} onCancel={() => setIsEmployeeModalOpen(false)} title="Employee of:">
                <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                    {allAdminUsers.map(user => (
                        <div key={user.Id} onClick={() => handleEmployeeSelection(user)} className={`${styles.employeeModalTile} ${selectedEmployeeUser?.Id === user.Id ? styles.selectedTile : ""}`}>
                            {user.FirstName} {user.LastName}
                            {user.Email && (
                                <div
                                    style={{
                                        fontSize: "12px",
                                        opacity: 0.8,
                                        marginTop: "4px"
                                    }}
                                >
                                    {user.Email}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </JC_Modal>

            {/* Qualifications Modal */}
            <JC_Modal isOpen={isQualificationsModalOpen} onCancel={() => setIsQualificationsModalOpen(false)} title="Choose Qualifications">
                <div>
                    {/* Select All/None Button */}
                    <div className={styles.selectAllContainer}>
                        <JC_Button text={selectedReportTypes.length === reportTypeOptions.length ? "Select None" : "Select All"} onClick={handleSelectAllQualifications} isSmall={true} />
                    </div>

                    <div className={styles.qualificationsContainer}>
                        {reportTypeOptions.map(option => (
                            <div key={option.Code} className={`${styles.qualificationTile} ${selectedReportTypes.includes(option.Code) ? styles.selected : ""}`} onClick={() => handleQualificationToggle(option.Code)}>
                                {option.Name}
                            </div>
                        ))}
                    </div>
                    <div className={styles.modalButtonsContainer}>
                        <JC_Button text="Cancel" onClick={() => setIsQualificationsModalOpen(false)} />
                        <JC_Button text="Save" onClick={() => setIsQualificationsModalOpen(false)} />
                    </div>
                </div>
            </JC_Modal>
        </>
    );
}
