import styles from "./JC_CasellaWeb.module.scss";
import { JC_Utils } from "@/app/Utils";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function JC_CasellaWeb(
    _: Readonly<{
        overrideClass?: string;
    }>
) {
    return (
        <Link className={`${styles.mainContainer} ${_.overrideClass || ""}`} href="https://casellaweb.com.au/" target="_blank" rel="noopener noreferrer">
            <div className={styles.text}>Created by</div>
            <Image className={styles.logo} src={"CasellaWebLogo.webp"} width={0} height={0} alt="CasellaWeb" unoptimized />
        </Link>
    );
}
