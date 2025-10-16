"use client";

import JC_Button from "../JC_Button/JC_Button";
import JC_Modal from "../JC_Modal/JC_Modal";
import JC_Spinner from "../JC_Spinner/JC_Spinner";
import styles from "./JC_ModalConfirmation.module.scss";
import React from "react";

export default function JC_ModalConfirmation(
    _: Readonly<{
        width?: string;
        title?: string;
        text: string;
        isOpen: boolean;
        onCancel: () => void;
        submitButtons: { text: string; onSubmit: () => void }[];
        isLoading?: boolean;
    }>
) {
    return (
        <JC_Modal overrideClass={styles.modalOverride} width={_.width} isOpen={_.isOpen} onCancel={_.onCancel} title={_.title}>
            <JC_Spinner overrideClass={`${styles.loadingSpinner} ${!_.isLoading ? styles.modalContentHidden : ""}`} />

            <div className={_.isLoading ? styles.modalContentHidden : ""}>
                <div className={styles.mainText}>{_.text}</div>
                <div className={styles.buttonsContainer}>
                    <JC_Button text="Cancel" onClick={_.onCancel} />
                    {_.submitButtons.map(b => (
                        <JC_Button key={b.text} text={b.text} onClick={b.onSubmit} />
                    ))}
                </div>
            </div>
        </JC_Modal>
    );
}
