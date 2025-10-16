"use client";

import JC_CasellaWeb from "../JC_CasellaWeb/JC_CasellaWeb";
import styles from "./JC_Footer.module.scss";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { useEffect, useState } from "react";

export default function JC_Footer() {
    const [siteName, setSiteName] = useState("Template");

    useEffect(() => {
        if (process.env.NAME) {
            setSiteName(process.env.NAME);
        }
    }, []);

    return (
        <div className={styles.mainContainer} id="JC_footer">
            <div className={styles.innerContainer}>
                {/* Nav Buttons */}
                <div className={styles.navButtons}>
                    <Link className={styles.link} href="/customer">
                        Home
                    </Link>
                    <Link className={styles.link} href="contact">
                        Contact
                    </Link>
                    <Link className={styles.link} href="privacyPolicy">
                        Privacy Policy
                    </Link>
                </div>

                {/* Social */}
                <div className={styles.rightContainer}>
                    <div className={styles.trademark}>© 2025 {siteName}</div>

                    <div className={styles.socialContainer}>
                        {/* Facebook */}
                        <Link href={"WWW"} target="_blank">
                            <Image className={styles.socialIcon} src="/icons/SocialFacebook.webp" width={0} height={0} alt="Facebook page link" unoptimized />
                        </Link>

                        {/* Insta */}
                        <Link href={"WWW"} target="_blank">
                            <Image className={styles.socialIcon} src="/icons/SocialInsta.webp" width={0} height={0} alt="Instagram page link" unoptimized />
                        </Link>
                    </div>

                    {/* Casella Web */}
                    <JC_CasellaWeb overrideClass={styles.casellaWebOverride} />
                </div>
            </div>
        </div>
    );
}
