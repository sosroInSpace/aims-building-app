"use client";

import { JC_Utils } from "../Utils";
import JC_Spinner from "../components/JC_Spinner/JC_Spinner";
import JC_Tabs from "../components/JC_Tabs/JC_Tabs";
import { LocalStorageKeyEnum } from "../enums/LocalStorageKey";
import { O_ReportTypeModel } from "../models/O_ReportType";
import RegisterTab from "./components/RegisterTab";
import UsersTab from "./components/UsersTab";
import styles from "./page.module.scss";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function Page_Users() {
    // - STATE - //
    const session = useSession();
    const [initialised, setInitialised] = useState(false);
    const [reportTypeOptions, setReportTypeOptions] = useState<O_ReportTypeModel[]>([]);

    // - EFFECTS - //

    useEffect(() => {
        const init = async () => {
            try {
                // Load report type options
                const reportTypes = await O_ReportTypeModel.GetList();
                setReportTypeOptions(reportTypes.ResultList);

                setInitialised(true);
            } catch (error) {
                console.error("Error initializing users page:", error);
                setInitialised(true);
            }
        };
        init();
    }, []);

    // Show welcome message if just logged in
    useEffect(() => {
        if (localStorage.getItem(LocalStorageKeyEnum.JC_ShowLoggedInWelcome) == "1" && session.data != null) {
            JC_Utils.showToastSuccess(`Welcome ${session.data?.user.FirstName}!`);
            localStorage.setItem(LocalStorageKeyEnum.JC_ShowLoggedInWelcome, "0");
        }
    }, [session.data]);

    // - MAIN - //

    if (!initialised) {
        return (
            <div className={styles.mainContainer}>
                <div className={styles.spinnerContainer}>
                    <JC_Spinner />
                </div>
            </div>
        );
    }

    return (
        <div className={styles.mainContainer}>
            <JC_Tabs
                tabs={[
                    {
                        title: "Users",
                        body: <UsersTab reportTypeOptions={reportTypeOptions} />
                    },
                    {
                        title: "Register",
                        body: <RegisterTab />
                    }
                ]}
            />
        </div>
    );
}
