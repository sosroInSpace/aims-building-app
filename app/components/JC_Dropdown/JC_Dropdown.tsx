"use client";

import JC_Checkbox from "../JC_Checkbox/JC_Checkbox";
import styles from "./JC_Dropdown.module.scss";
import JC_DropdownExpandedList from "./JC_DropdownExpandedList/JC_DropdownExpandedList";
import { JC_Utils } from "@/app/Utils";
import { DropdownTypeEnum } from "@/app/enums/DropdownType";
import { _ModelRequirements } from "@/app/models/_ModelRequirements";
import Image from "next/image";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

export default function JC_Dropdown<T extends _ModelRequirements = _ModelRequirements>(
    _: Readonly<{
        overrideClass?: string;
        type: DropdownTypeEnum;
        label?: string;
        placeholder?: string;
        options: T[];
        onOptionMouseOver?: (optionId: string) => void;
        onOptionMouseOut?: (optionId: string) => void;
        selectedOptionId?: string;
        selectedOptionIds?: string[]; // For multi-select
        removeSelectedInDropdown?: boolean;
        enableSearch?: boolean;
        onSelection: (newOptionId: string) => void;
        validate?: (value: string | number | undefined) => string;
        disabled?: boolean;
        readOnly?: boolean;
    }>
) {
    // - STATE - //

    const [thisInputId] = useState<string>(JC_Utils.generateGuid());
    const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
    const [searchBoxText, setSearchBoxText] = useState<string>();
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
    const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

    // Refs
    const buttonRef = useRef<HTMLDivElement>(null);

    // Effect to create portal container
    useEffect(() => {
        if (typeof document !== "undefined") {
            // Make sure we have a portal container
            setPortalContainer(document.body);
            console.log("JC_Dropdown - Portal container set to document.body");
        }
    }, []);

    // Function to update dropdown position
    const updateDropdownPosition = useCallback(() => {
        if (dropdownOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom,
                left: rect.left,
                width: rect.width
            });
        }
    }, [dropdownOpen]);

    // Effect to position dropdown when it opens
    useEffect(() => {
        if (dropdownOpen) {
            console.log("JC_Dropdown - Dropdown opened, updating position");
            updateDropdownPosition();
        }
    }, [dropdownOpen, updateDropdownPosition]);

    // Effect to handle window resize
    useEffect(() => {
        if (dropdownOpen) {
            window.addEventListener("resize", updateDropdownPosition);
            window.addEventListener("scroll", updateDropdownPosition);

            // Add click outside handler with timeout
            const handleClickOutside = (event: MouseEvent) => {
                // Add a timeout to delay the execution of the click outside handler
                setTimeout(() => {
                    const target = event.target as Node;
                    const dropdownElement = document.querySelector(".dropdownPortal");

                    console.log("Click outside handler triggered (with delay)");

                    // Check if the click is on a dropdown option
                    const isDropdownOption = (target as Element).classList?.contains("dropdownOption");
                    if (isDropdownOption) {
                        console.log("Click is on a dropdown option, not closing dropdown");
                        return; // Don't close the dropdown if clicking on an option
                    }

                    // Close only if click is outside both the button and dropdown
                    if (buttonRef.current && !buttonRef.current.contains(target) && (!dropdownElement || !dropdownElement.contains(target))) {
                        console.log("Closing dropdown from click outside");
                        setDropdownOpen(false);
                        setSearchBoxText("");
                    }
                }, 100); // 100ms delay to allow option selection to process first
            };

            document.addEventListener("mousedown", handleClickOutside);

            return () => {
                window.removeEventListener("resize", updateDropdownPosition);
                window.removeEventListener("scroll", updateDropdownPosition);
                document.removeEventListener("mousedown", handleClickOutside);
            };
        }
    }, [dropdownOpen, updateDropdownPosition]);

    // - INITIALISE - //

    // Effect to update dropdown position when search text changes
    useEffect(() => {
        if (dropdownOpen) {
            // Small delay to allow the filtered list to render
            setTimeout(updateDropdownPosition, 50);
        }
    }, [searchBoxText, dropdownOpen, updateDropdownPosition]);

    let optionsList = _.options;
    if (_.removeSelectedInDropdown && _.selectedOptionId) {
        optionsList = optionsList.filter(o => {
            const primaryKey = (o.constructor as any).primaryKey || "Code";
            return (o as any)[primaryKey] !== _.selectedOptionId;
        });
    }
    if (!JC_Utils.stringNullOrEmpty(searchBoxText)) {
        optionsList = optionsList.filter(o => {
            const primaryDisplayField = (o.constructor as any).primaryDisplayField || "Name";
            return JC_Utils.searchMatches(searchBoxText!, (o as any)[primaryDisplayField]);
        });
    }

    // - BUILD - //

    // Dropdown Option Content
    function buildOptionContent(option?: T, isMain?: boolean) {
        if (!option) {
            return (
                <React.Fragment>
                    {!JC_Utils.stringNullOrEmpty(_.placeholder) && (
                        <div
                            className={styles.optionLabel}
                            style={{
                                flexGrow: 1,
                                fontSize: "13px",
                                textAlign: "left"
                            }}
                        >
                            {_.placeholder}
                        </div>
                    )}
                </React.Fragment>
            );
        }

        const primaryDisplayField = (option.constructor as any).primaryDisplayField || "Name";
        const primaryKey = (option.constructor as any).primaryKey || "Code";
        const displayValue = (option as any)[primaryDisplayField];
        const keyValue = (option as any)[primaryKey];

        return (
            <React.Fragment>
                {!JC_Utils.stringNullOrEmpty(displayValue) && (
                    <div
                        className={styles.optionLabel}
                        style={{
                            flexGrow: 1,
                            fontSize: "13px",
                            textAlign: "left"
                        }}
                    >
                        {displayValue}
                    </div>
                )}

                {_.type == DropdownTypeEnum.Multi && !isMain && (
                    <div
                        className={styles.checkbox}
                        style={{
                            position: "absolute",
                            top: "50%",
                            transform: "translateY(-50%)",
                            right: "10px"
                        }}
                    >
                        <JC_Checkbox
                            checked={(() => {
                                // Check if this option is selected in multi-select mode
                                if (_.selectedOptionIds) {
                                    return _.selectedOptionIds.includes(keyValue);
                                }
                                // Fallback: try to parse selectedOptionId as JSON array
                                if (_.selectedOptionId) {
                                    try {
                                        const selectedIds = JSON.parse(_.selectedOptionId);
                                        return Array.isArray(selectedIds) && selectedIds.includes(keyValue);
                                    } catch {
                                        return false;
                                    }
                                }
                                return false;
                            })()}
                            onChange={() => _.onSelection(keyValue)}
                        />
                    </div>
                )}
            </React.Fragment>
        );
    }

    // - HANDLES - //

    // Function removed as we're now calling onSelection directly from the portal

    // - MAIN - //

    return (
        <div className={`${!JC_Utils.stringNullOrEmpty(_.overrideClass) ? _.overrideClass : ""}`}>
            {/* Label */}
            {!JC_Utils.stringNullOrEmpty(_.label) && (
                <div className={styles.label}>
                    {_.label}
                    {_.validate != null && !JC_Utils.stringNullOrEmpty(_.validate(_.selectedOptionId)) && <span className={styles.errorSpan}>{_.validate(_.selectedOptionId)}</span>}
                </div>
            )}

            {/* Dropdown */}
            <div className={styles.mainContainer}>
                {/* Selected Option */}
                <div
                    ref={buttonRef}
                    className={`${styles.mainButton} ${_.readOnly ? styles.readOnly : ""}`}
                    onClick={() => {
                        if (_.readOnly) return; // Don't open dropdown if readOnly
                        if (!dropdownOpen) {
                            setDropdownOpen(true);
                            setTimeout(() => document.getElementById(`dropdown-input-${thisInputId}`)?.focus(), 20);
                        } else {
                            setSearchBoxText("");
                            setDropdownOpen(false);
                        }
                    }}
                >
                    {/* Selected Option */}
                    {_.type === DropdownTypeEnum.Multi
                        ? // Multi-select display
                          (() => {
                              let selectedIds: string[] = [];
                              if (_.selectedOptionIds) {
                                  selectedIds = _.selectedOptionIds;
                              } else if (_.selectedOptionId) {
                                  try {
                                      selectedIds = JSON.parse(_.selectedOptionId);
                                  } catch {
                                      selectedIds = [];
                                  }
                              }

                              if (selectedIds.length === 0) {
                                  return <div style={{ color: "#999", fontSize: "13px" }}>Select options</div>;
                              }

                              const selectedOptions = optionsList.filter(o => {
                                  const primaryKey = (o.constructor as any).primaryKey || "Code";
                                  return selectedIds.includes((o as any)[primaryKey]);
                              });

                              const displayNames = selectedOptions.map(o => {
                                  const primaryDisplayField = (o.constructor as any).primaryDisplayField || "Name";
                                  return (o as any)[primaryDisplayField];
                              });

                              return <div style={{ fontSize: "13px", textAlign: "left" }}>{displayNames.length > 2 ? `${displayNames.slice(0, 2).join(", ")} +${displayNames.length - 2} more` : displayNames.join(", ")}</div>;
                          })()
                        : // Single select display
                          buildOptionContent(
                              optionsList.find(o => {
                                  const primaryKey = (o.constructor as any).primaryKey || "Code";
                                  return (o as any)[primaryKey] === _.selectedOptionId;
                              }),
                              true
                          )}

                    {/* Chevron */}
                    <Image className={styles.chevronIcon} src="/icons/Chevron.webp" style={dropdownOpen ? { rotate: "180deg", top: "-3%" } : {}} width={0} height={0} alt="Bag" unoptimized />

                    {/* Search */}
                    {_.enableSearch && dropdownOpen && (
                        <input
                            id={`dropdown-input-${thisInputId}`}
                            className={styles.searchBox}
                            type="text"
                            placeholder="Search..."
                            value={searchBoxText || ""}
                            onChange={event => {
                                // Update search text which will filter the options list
                                setSearchBoxText(event.target.value);
                                // Force position update after a short delay to ensure the dropdown repositions if needed
                                setTimeout(updateDropdownPosition, 50);
                            }}
                            onKeyDown={event => {
                                // Handle Escape key - close dropdown
                                if (event.key === "Escape") {
                                    setSearchBoxText("");
                                    setDropdownOpen(false);
                                }
                                // Handle Enter key - select first item if available
                                else if (event.key === "Enter" && optionsList.length > 0) {
                                    const firstOption = optionsList[0];
                                    const primaryKey = (firstOption.constructor as any).primaryKey || "Code";
                                    const keyValue = (firstOption as any)[primaryKey];
                                    console.log("JC_Dropdown - Enter key pressed, selecting first option:", keyValue);
                                    _.onSelection(keyValue);
                                    setTimeout(() => {
                                        setSearchBoxText("");
                                        setDropdownOpen(false);
                                    }, 50);
                                }
                            }}
                        />
                    )}
                </div>

                {/* Portal elements */}
                {dropdownOpen && portalContainer && (
                    <>
                        {/* Dropdown List - Rendered in Portal */}
                        {createPortal(
                            <JC_DropdownExpandedList
                                options={optionsList}
                                selectedOptionId={_.selectedOptionId}
                                type={_.type}
                                position={dropdownPosition}
                                onOptionMouseOver={_.onOptionMouseOver}
                                onOptionMouseOut={_.onOptionMouseOut}
                                onSelection={optionId => {
                                    console.log("JC_Dropdown - Portal onSelection called with optionId:", optionId);
                                    // Call parent onSelection directly to ensure the event is processed
                                    _.onSelection(optionId);
                                    // For single select, close the dropdown after a short delay
                                    // For multi-select, keep it open
                                    if (_.type === DropdownTypeEnum.Default) {
                                        setTimeout(() => {
                                            setSearchBoxText("");
                                            setDropdownOpen(false);
                                        }, 50);
                                    }
                                }}
                                buildOptionContent={option => buildOptionContent(option)}
                            />,
                            portalContainer
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
