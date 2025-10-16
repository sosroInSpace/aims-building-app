"use client";

import JC_Button from "./components/JC_Button/JC_Button";
import styles from "./tempComingSoon.module.scss";
import { signIn } from "next-auth/react";
import React from "react";

export default function TempComingSoon() {
    return (
        <div className={styles.mainContainer}>
            <div className={styles.contentContainer}>
                <h1>Coming Soon</h1>
                <p>This site is currently under development.</p>
                <JC_Button text="Sign In" onClick={() => signIn()} overrideClass={styles.signInButton} />
            </div>
        </div>
    );
}
