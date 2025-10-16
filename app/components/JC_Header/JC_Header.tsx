import { auth } from "../../auth";
import styles from "./JC_Header.module.scss";
import JC_HeaderButton from "./JC_HeaderButton";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export default async function JC_Header() {
    const session = await auth();

    // Get user's full name for support email subject
    const userFullName = session?.user ? `${session.user.FirstName} ${session.user.LastName}` : "";

    // Check if user is admin (EmployeeOfUserId is null)
    const isAdmin = session?.user && !session.user.EmployeeOfUserId;

    return (
        <React.Fragment>
            {/* Header */}
            <div className={styles.mainContainer} id="JC_header">
                {/* Logo + Account */}
                <div className={styles.logoAccountContainer}>
                    {/* Logo */}
                    <Link href="/customer">
                        <Image src="/logos/Main [Simple].webp" alt={"MainLogo"} width={0} height={0} className={styles.logo} unoptimized />
                    </Link>
                </div>

                {/* Navs */}
                <div className={styles.navsContainer}>
                    {/* Nav Buttons */}
                    <div className={styles.navButtons}>
                        {isAdmin && <JC_HeaderButton linkToPage="users" text="Users" iconName="Group" iconWidth={25} />}
                        <JC_HeaderButton linkToPage="customer" text="Customer" iconName="User2" iconWidth={23} />
                        <JC_HeaderButton linkToPage="property" text="Property" iconName="House" iconWidth={27} />
                        <JC_HeaderButton linkToPage="defects" text="Defects" iconName="Important" iconWidth={25} />
                        <JC_HeaderButton linkToPage="reportSummary" text="Report Summary" iconName="Document" iconWidth={25} />
                        <JC_HeaderButton linkToPage="report" text="Generate Report" iconName="Document" iconWidth={25} />
                        <JC_HeaderButton emailTo={process.env.EMAIL_SUPPORT} userFullName={userFullName} text="Support" iconName="Email" iconWidth={23} />
                        <JC_HeaderButton linkToPage="account" text="Account" iconName="User2" iconWidth={23} />
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
}
