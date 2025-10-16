"use client";

import styles from "./JC_ThreeDotsMenu.module.scss";
import React, { useState, useRef, useEffect } from "react";

interface JC_ThreeDotsMenuProps {
    menuItems: {
        label: string;
        onClick: () => void;
    }[];
    overrideClass?: string;
}

export default function JC_ThreeDotsMenu({ menuItems, overrideClass }: JC_ThreeDotsMenuProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLDivElement>(null);

    // Toggle menu open/closed
    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && buttonRef.current && !menuRef.current.contains(event.target as Node) && !buttonRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className={`${styles.mainContainer} ${overrideClass || ""}`}>
            {/* Three Dots Button */}
            <div ref={buttonRef} className={`${styles.threeDotsButton} ${menuOpen ? styles.active : ""}`} onClick={toggleMenu}>
                <svg width="4" height="18" viewBox="0 0 4 18" className={styles.threeDotsIcon}>
                    <circle cx="2" cy="2" r="2" fill="#02FF01" />
                    <circle cx="2" cy="9" r="2" fill="#02FF01" />
                    <circle cx="2" cy="16" r="2" fill="#02FF01" />
                </svg>
            </div>

            {/* Menu Items */}
            <div ref={menuRef} className={`${styles.menuItems} ${menuOpen ? styles.open : ""}`}>
                {menuItems.map((item, index) => (
                    <div
                        key={index}
                        className={styles.menuItem}
                        onClick={() => {
                            item.onClick();
                            setMenuOpen(false);
                        }}
                    >
                        {item.label}
                    </div>
                ))}
            </div>
        </div>
    );
}
