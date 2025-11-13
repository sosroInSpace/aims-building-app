"use client";

import { LocalStorageKeyEnum } from "../../enums/LocalStorageKey";
import { UserModel } from "../../models/User";
import styles from "./JC_SelectedSubUserDisplay.module.scss";
import { useEffect, useState } from "react";

export default function JC_SelectedSubUserDisplay() {
    const [selectedSubUser, setSelectedSubUser] = useState<UserModel | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // Load selected sub-user from localStorage
    const loadSelectedSubUser = async () => {
        try {
            const selectedSubUserId = localStorage.getItem(LocalStorageKeyEnum.JC_SelectedSubUserId);
            if (selectedSubUserId) {
                // Check if user exists
                const userExists = await UserModel.ItemExists(selectedSubUserId);
                if (userExists) {
                    // Load the full user data
                    const userData = await UserModel.Get(selectedSubUserId);
                    if (userData) {
                        setSelectedSubUser(userData);
                    } else {
                        // User data not found, clear localStorage
                        localStorage.removeItem(LocalStorageKeyEnum.JC_SelectedSubUserId);
                        setSelectedSubUser(null);
                    }
                } else {
                    // User doesn't exist, clear localStorage
                    localStorage.removeItem(LocalStorageKeyEnum.JC_SelectedSubUserId);
                    setSelectedSubUser(null);
                }
            } else {
                // No selected sub-user, clear state
                setSelectedSubUser(null);
            }
        } catch (error) {
            console.error("Error loading selected sub-user:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        loadSelectedSubUser();
    }, []);

    // Listen for localStorage changes (when sub-user is selected/deselected)
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === LocalStorageKeyEnum.JC_SelectedSubUserId) {
                setIsLoading(true);
                loadSelectedSubUser();
            }
        };

        // Listen for storage events from other tabs/windows
        window.addEventListener("storage", handleStorageChange);

        // Custom event listener for same-tab localStorage changes
        const handleCustomStorageChange = () => {
            setIsLoading(true);
            loadSelectedSubUser();
        };

        window.addEventListener("localStorageChange", handleCustomStorageChange);

        return () => {
            window.removeEventListener("storage", handleStorageChange);
            window.removeEventListener("localStorageChange", handleCustomStorageChange);
        };
    }, []);

    // Handle clear button click
    const handleClear = () => {
        // Clear both selected sub-user and selected customer
        localStorage.removeItem(LocalStorageKeyEnum.JC_SelectedSubUserId);
        localStorage.removeItem(LocalStorageKeyEnum.JC_SelectedCustomer);
        setSelectedSubUser(null);

        // Dispatch custom event to notify other components of the change
        window.dispatchEvent(new CustomEvent("localStorageChange"));

        // Refresh the page to update any components that depend on these values
        window.location.reload();
    };

    // Don't render anything if loading or no selected sub-user
    if (isLoading || !selectedSubUser) {
        return null;
    }

    const fullName = `${selectedSubUser.FirstName} ${selectedSubUser.LastName}`.trim();

    return (
        <div className={styles.container} onClick={handleClear} title="Clear selected sub-user">
            <span className={styles.userName}>{fullName}</span>
            <span className={styles.clearButton}>×</span>
        </div>
    );
}
