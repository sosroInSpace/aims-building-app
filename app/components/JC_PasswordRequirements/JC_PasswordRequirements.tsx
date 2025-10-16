"use client";

import styles from "./JC_PasswordRequirements.module.scss";
import { JC_Utils_Validation } from "@/app/Utils";
import Image from "next/image";
import React, { useEffect, useState } from "react";

export default function JC_PasswordRequirements(
    _: Readonly<{
        password: string;
        showErrors: boolean;
    }>
) {
    // State to track which requirements are met
    const [lengthValid, setLengthValid] = useState<boolean>(false);
    const [numberValid, setNumberValid] = useState<boolean>(false);

    // Update validation state when password changes
    useEffect(() => {
        setLengthValid(JC_Utils_Validation.validPasswordLength(_.password));
        setNumberValid(JC_Utils_Validation.validPasswordNumber(_.password));
    }, [_.password]);

    // Helper function to determine the class for each requirement
    const getRequirementClass = (isValid: boolean) => {
        if (isValid) {
            return styles.valid;
        }
        return _.showErrors ? styles.invalid : "";
    };

    return (
        <div className={styles.mainContainer}>
            <ul>
                <li className={getRequirementClass(lengthValid)}>
                    <span>At least 6 characters</span>
                    {lengthValid && <div className={styles.checkmark} />}
                </li>
                <li className={getRequirementClass(numberValid)}>
                    <span>At least 1 number</span>
                    {numberValid && <div className={styles.checkmark} />}
                </li>
            </ul>
        </div>
    );
}
