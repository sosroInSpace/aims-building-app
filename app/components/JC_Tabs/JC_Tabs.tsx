"use client";

import styles from "./JC_Tabs.module.scss";
import { JC_Utils } from "@/app/Utils";
import React, { ReactNode, useState } from "react";

export default function JC_Tabs(
    _: Readonly<{
        overrideClass?: string;
        onTabChange?: () => void;
        initialTab?: number;
        tabs: {
            title: string;
            body: ReactNode;
        }[];
    }>
) {
    // - STATE - //

    const [selectedTab, setSelectedTab] = useState<number>(0);

    // - HANDLE - //

    function handleTabClick(index: number) {
        if (index != selectedTab) {
            setSelectedTab(index);
            if (_.onTabChange != null) {
                _.onTabChange();
            }
        }
    }

    // - MAIN - //

    return (
        <div className={`${styles.mainContainer} ${!JC_Utils.stringNullOrEmpty(_.overrideClass) ? _.overrideClass : ""}`}>
            {/* Tabs */}
            <div className={styles.tabsContainer}>
                {_.tabs.map((t, index) => (
                    <div key={t.title} className={`${styles.tab} ${index == selectedTab ? styles.selected : ""}`} onClick={() => handleTabClick(index)}>
                        {t.title}
                    </div>
                ))}
            </div>

            {/* Body */}
            <div key={_.tabs[selectedTab].title} className={styles.tabBody}>
                {_.tabs[selectedTab].body}
            </div>
        </div>
    );
}
