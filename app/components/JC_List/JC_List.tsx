"use client";

import JC_Field from "../JC_Field/JC_Field";
import JC_Modal from "../JC_Modal/JC_Modal";
import JC_Spinner from "../JC_Spinner/JC_Spinner";
import styles from "./JC_List.module.scss";
import { JC_ListHeader } from "./JC_ListHeader";
import { JC_Utils } from "@/app/Utils";
import { FieldTypeEnum } from "@/app/enums/FieldType";
import { JC_ListPagingModel, JC_ListPagingResultModel } from "@/app/models/ComponentModels/JC_ListPagingModel";
import Image from "next/image";
import React, { ReactNode, useState, useCallback, useEffect, useRef } from "react";

export default function JC_List<T>(
    _: Readonly<{
        overrideClass?: string;
        service: (paging?: JC_ListPagingModel, abortSignal?: AbortSignal) => Promise<JC_ListPagingResultModel<T>>;
        headers: JC_ListHeader[];
        row: (item: T) => ReactNode;
        defaultSortKey?: string;
        defaultSortAsc?: boolean;
        showAll?: boolean;
        searchFields?: string[];
        initialisedCallback?: () => void;
    }>
) {
    // - STATE - //
    const [items, setItems] = useState<T[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [initialised, setInitialised] = useState<boolean>(false);
    const [dataFetched, setDataFetched] = useState<boolean>(false);
    const [sortField, setSortField] = useState<string | undefined>(_.defaultSortKey);
    const [sortAsc, setSortAsc] = useState<boolean>(_.defaultSortAsc !== false);
    const [searchText, setSearchText] = useState<string>("");
    const [paging, setPaging] = useState<JC_ListPagingModel>({
        PageSize: 10,
        PageIndex: 0,
        Sorts: _.defaultSortKey ? [{ SortField: _.defaultSortKey, SortAsc: _.defaultSortAsc !== false }] : [],
        SearchText: "",
        SearchFields: _.searchFields || []
    });
    const [totalPages, setTotalPages] = useState<number>(0);
    const [totalCount, setTotalCount] = useState<number>(0);

    // Track if user has explicitly selected a sort
    // Initially false because we start with the default sort
    const [userSelectedSort, setUserSelectedSort] = useState<boolean>(false);

    // Page size modal state
    const [isPageSizeModalOpen, setIsPageSizeModalOpen] = useState<boolean>(false);

    // Helper function to get filtered page size options based on total count
    const getFilteredPageSizeOptions = useCallback(() => {
        const allOptions = [10, 20, 50];

        if (totalCount === 0) {
            return allOptions; // Show all options when no data
        }

        const filteredOptions: number[] = [];

        // Add options that are less than total count
        for (const option of allOptions) {
            if (option < totalCount) {
                filteredOptions.push(option);
            }
        }

        // Add the next option that is greater than total count (if exists)
        const nextLargerOption = allOptions.find(option => option >= totalCount);
        if (nextLargerOption && !filteredOptions.includes(nextLargerOption)) {
            filteredOptions.push(nextLargerOption);
        }

        // Always include at least one option (the smallest one)
        if (filteredOptions.length === 0) {
            filteredOptions.push(allOptions[0]);
        }

        return filteredOptions;
    }, [totalCount]);

    // AbortController ref for cancelling requests
    const abortControllerRef = useRef<AbortController | null>(null);

    // - EFFECTS - //
    useEffect(() => {
        const loadData = async () => {
            try {
                // Cancel any previous request
                if (abortControllerRef.current) {
                    abortControllerRef.current.abort();
                }

                // Create new AbortController for this request
                const abortController = new AbortController();
                abortControllerRef.current = abortController;

                setIsLoading(true);
                setDataFetched(false);

                // If showAll is true, don't pass paging to service (get all data for frontend sorting)
                // If showAll is false/undefined, pass paging to service (use backend paging)
                const result = await _.service(_.showAll ? undefined : paging, abortController.signal);

                // Only update state if the request wasn't aborted
                if (!abortController.signal.aborted) {
                    setItems(result.ResultList);
                    setTotalPages(result.TotalPages || 0);
                    setTotalCount(result.TotalCount || 0);
                    setDataFetched(true);
                }
            } catch (error) {
                // Only handle errors if the request wasn't aborted
                if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
                    console.error("Error loading data:", error);
                    setItems([]);
                    setTotalPages(0);
                    setTotalCount(0);
                    setDataFetched(true); // Set to true so loading can be turned off
                }
            } finally {
                // Note: setIsLoading(false) is now handled in a separate useEffect
                // to ensure it's called after items have been set and rendered

                // But we still handle setInitialised here as before
                if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
                    // Call the initialised callback only once when first initialised
                    if (!initialised && _.initialisedCallback) {
                        setInitialised(true);
                        _.initialisedCallback();
                    }
                }
            }
        };

        loadData();

        // Cleanup function to cancel any ongoing request when component unmounts
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [_, paging, initialised]);

    // Effect to set isLoading to false after items have been successfully set and rendered
    useEffect(() => {
        // Only set isLoading to false if:
        // 1. Data has been fetched (either successfully or with error)
        // 2. We're currently loading
        if (dataFetched && isLoading) {
            setIsLoading(false);
        }
    }, [dataFetched, isLoading]);

    // - HANDLERS - //

    const handleSort = useCallback(
        (key: string) => {
            // Check if this is the default sort key and direction
            const defaultSortAsc = _.defaultSortAsc !== false;
            const isDefaultSort = key === _.defaultSortKey && !userSelectedSort && sortAsc === defaultSortAsc;

            // If clicking on the default sort column for the first time, keep same direction but mark as user-selected
            if (isDefaultSort) {
                setUserSelectedSort(true);
                return;
            }

            // If no previous sort key or different key, sort ascending
            if (!sortField || sortField !== key) {
                setUserSelectedSort(true);
                setSortField(key);
                setSortAsc(true);
                // Only update paging if not showing all (backend paging)
                if (!_.showAll) {
                    setPaging(prev => ({ ...prev, Sorts: [{ SortField: key, SortAsc: true }] }));
                }
                return;
            }

            // If already sorting by this key in ascending order, switch to descending
            if (sortAsc) {
                setUserSelectedSort(true);
                setSortField(key);
                setSortAsc(false);
                // Only update paging if not showing all (backend paging)
                if (!_.showAll) {
                    setPaging(prev => ({ ...prev, Sorts: [{ SortField: key, SortAsc: false }] }));
                }
                return;
            }

            // If already sorting by this key in descending order, remove sort and fall back to default
            setUserSelectedSort(false);
            setSortField(_.defaultSortKey);
            setSortAsc(defaultSortAsc);
            // Only update paging if not showing all (backend paging)
            if (!_.showAll) {
                setPaging(prev => ({
                    ...prev,
                    Sorts: _.defaultSortKey ? [{ SortField: _.defaultSortKey, SortAsc: defaultSortAsc }] : []
                }));
            }
        },
        [_.defaultSortKey, _.defaultSortAsc, _.showAll, userSelectedSort, sortField, sortAsc]
    );

    const handlePageChange = useCallback(
        (newPageIndex: number) => {
            const currentPageIndex = paging.PageIndex ?? 0;
            if (newPageIndex >= 0 && newPageIndex < totalPages && newPageIndex !== currentPageIndex) {
                setPaging(prev => ({ ...prev, PageIndex: newPageIndex }));
            }
        },
        [totalPages, paging.PageIndex]
    );

    const handlePreviousPage = useCallback(() => {
        const currentPageIndex = paging.PageIndex ?? 0;
        if (currentPageIndex > 0) {
            handlePageChange(currentPageIndex - 1);
        }
    }, [paging.PageIndex, handlePageChange]);

    const handleNextPage = useCallback(() => {
        const currentPageIndex = paging.PageIndex ?? 0;
        if (currentPageIndex < totalPages - 1) {
            handlePageChange(currentPageIndex + 1);
        }
    }, [paging.PageIndex, totalPages, handlePageChange]);

    const handleFirstPage = useCallback(() => {
        const currentPageIndex = paging.PageIndex ?? 0;
        if (currentPageIndex > 0) {
            handlePageChange(0);
        }
    }, [paging.PageIndex, handlePageChange]);

    const handleLastPage = useCallback(() => {
        const currentPageIndex = paging.PageIndex ?? 0;
        if (currentPageIndex < totalPages - 1) {
            handlePageChange(totalPages - 1);
        }
    }, [paging.PageIndex, totalPages, handlePageChange]);

    const handlePageSizeChange = useCallback((newPageSize: number) => {
        setPaging(prev => ({
            ...prev,
            PageSize: newPageSize,
            PageIndex: 0 // Reset to first page when changing page size
        }));
        setIsPageSizeModalOpen(false); // Close modal after selection
    }, []);

    const handlePageSizeModalClose = useCallback(() => {
        setIsPageSizeModalOpen(false);
    }, []);

    const handleSearchChange = useCallback((newSearchText: string) => {
        // Cancel any previous request immediately
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        setSearchText(newSearchText);
        setPaging(prev => ({
            ...prev,
            SearchText: newSearchText,
            PageIndex: 0 // Reset to first page when searching
        }));
    }, []);

    const handleClearSearch = useCallback(() => {
        // Cancel any previous request immediately
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        setSearchText("");
        setPaging(prev => ({
            ...prev,
            SearchText: "",
            PageIndex: 0 // Reset to first page when clearing search
        }));
    }, []);

    const sortItems = (items: T[], key?: string, direction?: "asc" | "desc") => {
        if (!key || !direction) return items;

        return [...items].sort((a, b) => {
            // Access the property directly using the sort key
            const aValue = (a as any)[key];
            const bValue = (b as any)[key];

            // Handle different types of values
            if (aValue === bValue) return 0;

            // Handle null/undefined values
            if (aValue == null) return 1;
            if (bValue == null) return -1;

            // Handle different data types
            if (typeof aValue === "string" && typeof bValue === "string") {
                // Check if both strings are actually numbers
                const aIsNumber = !isNaN(Number(aValue)) && !isNaN(parseFloat(aValue));
                const bIsNumber = !isNaN(Number(bValue)) && !isNaN(parseFloat(bValue));

                if (aIsNumber && bIsNumber) {
                    // Both are numbers, compare numerically
                    const aNum = parseFloat(aValue);
                    const bNum = parseFloat(bValue);
                    return direction === "asc" ? (aNum > bNum ? 1 : aNum < bNum ? -1 : 0) : bNum > aNum ? 1 : bNum < aNum ? -1 : 0;
                } else {
                    // At least one is not a number, compare as strings
                    return direction === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
                }
            }

            // Handle numbers and other comparable types
            return direction === "asc" ? (aValue > bValue ? 1 : -1) : bValue > aValue ? 1 : -1;
        });
    };

    // Get sorted items for rendering
    // Only use frontend sorting when showAll is true
    const displayItems = _.showAll && sortField && items ? sortItems(items, sortField, sortAsc ? "asc" : "desc") : items;

    // Calculate how many placeholder items we need to fill the page
    const getPlaceholderCount = () => {
        if (_.showAll) {
            return 0;
        }

        // When loading, always show placeholders (even if no items yet)
        if (isLoading) {
            const pageSize = paging.PageSize ?? 10;
            const currentItemCount = displayItems?.length || 0;
            return pageSize - currentItemCount;
        }

        // When not loading and no items, don't show placeholders
        if (!displayItems || displayItems.length === 0) {
            return 0;
        }

        // When not loading and only 1 page, don't show placeholders
        if (totalPages === 1) {
            return 0;
        }

        const pageSize = paging.PageSize ?? 10;
        const currentItemCount = displayItems.length;
        return currentItemCount < pageSize ? pageSize - currentItemCount : 0;
    };

    // Generate placeholder items (using the last real item as template if available)
    const generatePlaceholderItems = () => {
        const placeholderCount = getPlaceholderCount();
        if (placeholderCount === 0) {
            return [];
        }

        // When loading and no items yet, create a basic placeholder structure
        if (isLoading && (!displayItems || displayItems.length === 0)) {
            const placeholders = [];
            for (let i = 0; i < placeholderCount; i++) {
                placeholders.push({
                    __isPlaceholder: true,
                    __placeholderIndex: i,
                    __isLoadingPlaceholder: true
                });
            }
            return placeholders;
        }

        // When we have items, use the last item as a template for placeholder structure
        if (!displayItems || displayItems.length === 0) {
            return [];
        }

        const templateItem = displayItems[displayItems.length - 1];
        const placeholders = [];

        for (let i = 0; i < placeholderCount; i++) {
            placeholders.push({
                ...templateItem,
                // Add a unique identifier to distinguish placeholders
                __isPlaceholder: true,
                __placeholderIndex: i
            });
        }

        return placeholders;
    };

    // Helper function to generate page numbers for display
    const getPageNumbers = () => {
        const currentPage = (paging.PageIndex ?? 0) + 1; // Convert to 1-based
        const pages: (number | string)[] = [];

        // If 4 or fewer pages, show all pages
        if (totalPages <= 4) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
            return pages;
        }

        // More than 4 pages - show 4 buttons with ellipses logic
        let startPage: number;
        let endPage: number;

        if (currentPage <= 2) {
            // Current page is near the beginning - show pages 1, 2, 3, 4
            startPage = 1;
            endPage = 4;
        } else if (currentPage >= totalPages - 1) {
            // Current page is near the end - show last 4 pages
            startPage = totalPages - 3;
            endPage = totalPages;
        } else {
            // Current page is in the middle - show current page and surrounding pages
            startPage = currentPage - 1;
            endPage = currentPage + 2;
        }

        // Add the 4 page buttons
        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        // Add ellipsis if there are pages before the start
        if (startPage > 1) {
            pages.unshift("...");
        }

        // Add ellipsis if there are pages after the end
        if (endPage < totalPages) {
            pages.push("...");
        }

        return pages;
    };

    // - MAIN - //

    return (
        <div className={styles.mainContainer}>
            {/* Search Field - only show if searchFields are provided */}
            {_.searchFields && _.searchFields.length > 0 && (
                <div className={`${styles.searchContainer} ${_.headers.length > 1 ? styles.multiColumn : ""}`}>
                    <JC_Field inputId="list-search" type={FieldTypeEnum.Text} placeholder="Search..." value={searchText} onChange={handleSearchChange} />
                    {searchText && (
                        <button className={styles.clearSearchButton} onClick={handleClearSearch} title="Clear search" type="button">
                            ×
                        </button>
                    )}
                </div>
            )}

            <table className={`${styles.table} ${isLoading ? styles.loading : ""} ${!JC_Utils.stringNullOrEmpty(_.overrideClass) ? _.overrideClass : ""}`}>
                <thead>
                    <tr>
                        {_.headers.map(header => (
                            <th
                                key={header.sortKey}
                                className={`
                                    ${styles.sortable}
                                    ${header.hideOnTeenyTiny ? styles.hideOnTeenyTiny : ""}
                                    ${header.hideOnTiny ? styles.hideOnTiny : ""}
                                    ${header.hideOnSmall ? styles.hideOnSmall : ""}
                                    ${header.hideOnMedium ? styles.hideOnMedium : ""}
                                    ${header.hideOnLarge ? styles.hideOnLarge : ""}
                                `}
                                onClick={() => handleSort(header.sortKey)}
                            >
                                <div className={styles.headerLabelContainer}>
                                    <div className={styles.headerLabel}>{header.label}</div>
                                    {sortField === header.sortKey && userSelectedSort && (
                                        <Image
                                            src="/icons/Chevron.webp"
                                            width={0}
                                            height={0}
                                            alt="Sort indicator"
                                            className={styles.sortIndicator}
                                            style={{
                                                transform: sortAsc ? "rotate(180deg)" : "rotate(0deg)"
                                            }}
                                            unoptimized
                                        />
                                    )}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {(() => {
                        const placeholderItems = generatePlaceholderItems();
                        const allItems = [...(displayItems || []), ...placeholderItems];

                        // If loading and no items (including placeholders), show loading message
                        if (isLoading && allItems.length === 0) {
                            return (
                                <tr className={styles.noDataRow}>
                                    <td colSpan={100} className={styles.noDataCell}>
                                        Loading...
                                    </td>
                                </tr>
                            );
                        }

                        // If not loading and no items, show no results message
                        if (!isLoading && (!displayItems || displayItems.length === 0)) {
                            return (
                                <tr className={styles.noDataRow}>
                                    <td colSpan={100} className={styles.noDataCell}>
                                        No results
                                    </td>
                                </tr>
                            );
                        }

                        // Render items and placeholders
                        return allItems.map((item, index) => {
                            const isPlaceholder = (item as any).__isPlaceholder;
                            const isLoadingPlaceholder = (item as any).__isLoadingPlaceholder;
                            const placeholderIndex = (item as any).__placeholderIndex;

                            // For loading placeholders when no items, create a simple row
                            if (isLoadingPlaceholder) {
                                return (
                                    <tr key={`loading-placeholder-${placeholderIndex}`} className={`${styles.tableRow} ${styles.loadingRow} ${styles.placeholderRow}`} style={{ pointerEvents: "none", visibility: "hidden" }}>
                                        {_.headers.map((header, cellIndex) => (
                                            <td
                                                key={cellIndex}
                                                className={`
                                                    ${header.hideOnTeenyTiny ? styles.hideOnTeenyTiny : ""}
                                                    ${header.hideOnTiny ? styles.hideOnTiny : ""}
                                                    ${header.hideOnSmall ? styles.hideOnSmall : ""}
                                                    ${header.hideOnMedium ? styles.hideOnMedium : ""}
                                                    ${header.hideOnLarge ? styles.hideOnLarge : ""}
                                                `}
                                            >
                                                &nbsp;
                                            </td>
                                        ))}
                                    </tr>
                                );
                            }

                            // Get the original row element for real items and template-based placeholders
                            const originalRow = _.row(item as T);

                            // Clone the element and add the appropriate classes
                            if (React.isValidElement(originalRow)) {
                                // Determine the key for the row
                                const rowKey = isPlaceholder ? `placeholder-${placeholderIndex}` : originalRow.key || `item-${index}`;

                                // Clone the row element with the appropriate classes
                                const rowElement = React.cloneElement(originalRow, {
                                    key: rowKey,
                                    className: `${styles.tableRow} ${originalRow.props.className || ""} ${isLoading ? styles.loadingRow : ""} ${isPlaceholder ? styles.placeholderRow : ""}`,
                                    onClick: isPlaceholder ? undefined : (originalRow.props as any).onClick,
                                    style: isPlaceholder ? { pointerEvents: "none", visibility: "hidden" } : undefined
                                } as React.HTMLAttributes<HTMLElement>);

                                // Apply responsive classes to the cells
                                if (React.isValidElement(rowElement)) {
                                    // Type assertion to access props safely
                                    const rowProps = rowElement.props as { children?: React.ReactNode };

                                    if (rowProps.children) {
                                        const cells = React.Children.toArray(rowProps.children);
                                        const cellsWithClasses = cells.map((cell, cellIndex) => {
                                            if (React.isValidElement(cell) && cellIndex < _.headers.length) {
                                                const header = _.headers[cellIndex];
                                                // Type assertion for cell props
                                                const cellProps = cell.props as { className?: string; children?: React.ReactNode };

                                                return React.cloneElement(cell, {
                                                    className: `
                                                        ${cellProps.className || ""}
                                                        ${header.hideOnTeenyTiny ? styles.hideOnTeenyTiny : ""}
                                                        ${header.hideOnTiny ? styles.hideOnTiny : ""}
                                                        ${header.hideOnSmall ? styles.hideOnSmall : ""}
                                                        ${header.hideOnMedium ? styles.hideOnMedium : ""}
                                                        ${header.hideOnLarge ? styles.hideOnLarge : ""}
                                                    `,
                                                    children: cellProps.children
                                                } as React.HTMLAttributes<HTMLElement>);
                                            }
                                            return cell;
                                        });

                                        return React.cloneElement(rowElement, {}, ...cellsWithClasses);
                                    }
                                }

                                return rowElement;
                            }

                            return originalRow;
                        });
                    })()}
                </tbody>
            </table>

            {/* Loading Spinner Overlay */}
            {isLoading && (
                <div className={styles.tableSpinnerOverlay}>
                    <JC_Spinner />
                </div>
            )}

            {/* Page Info for single page - only show if not showAll, exactly 1 page, and not loading */}
            {!_.showAll && totalPages === 1 && !isLoading && (
                <div className={styles.pagingControlsContainer}>
                    <div className={styles.pageInfo}>{`${totalCount} items`}</div>
                </div>
            )}

            {/* Paging Controls - only show if not showAll and we have multiple pages */}
            {!_.showAll && totalPages > 1 && (
                <div className={styles.pagingControlsContainer}>
                    <div className={styles.pageInfo}>
                        {(() => {
                            const currentPageIndex = paging.PageIndex ?? 0;
                            return `Page ${currentPageIndex + 1} of ${totalPages}`;
                        })()}
                        <br />
                        {(() => {
                            const currentPageIndex = paging.PageIndex ?? 0;
                            const pageSize = paging.PageSize ?? 10;
                            const beginningItem = currentPageIndex * pageSize + 1;
                            const endingItem = Math.min((currentPageIndex + 1) * pageSize, totalCount);
                            return `Items ${beginningItem} - ${endingItem} of ${totalCount}`;
                        })()}
                    </div>
                    <div className={styles.pagingButtons}>
                        {(() => {
                            const pageNumbers = getPageNumbers();
                            const ellipsesCount = pageNumbers.filter(page => page === "...").length;
                            const hasBothEllipses = ellipsesCount === 2;

                            return (
                                <>
                                    {/* First Page Button */}
                                    <button className={`${styles.pagingButton} ${styles.firstButton}`} onClick={handleFirstPage} disabled={(paging.PageIndex ?? 0) === 0} title="First Page">
                                        <Image src="/icons/Chevron.webp" width={0} height={0} alt="First page" className={styles.doubleChevronLeft} unoptimized />
                                        <Image src="/icons/Chevron.webp" width={0} height={0} alt="First page" className={styles.doubleChevronLeft} unoptimized />
                                    </button>

                                    {/* Previous Page Button */}
                                    <button className={`${styles.pagingButton} ${styles.previousButton}`} onClick={handlePreviousPage} disabled={(paging.PageIndex ?? 0) === 0} title="Previous Page">
                                        <Image src="/icons/Chevron.webp" width={0} height={0} alt="Previous page" className={styles.chevronLeft} unoptimized />
                                    </button>

                                    {/* Spacer between Previous and Page Numbers - only if not both ellipses */}
                                    {!hasBothEllipses && <div className={styles.pagingSpacer}></div>}

                                    {pageNumbers.map((pageNum, index) =>
                                        pageNum === "..." ? (
                                            <span key={`ellipsis-${index}`} className={styles.ellipsis}>
                                                ...
                                            </span>
                                        ) : (
                                            <button key={pageNum} className={`${styles.pagingButton} ${styles.pageNumber} ${pageNum === (paging.PageIndex ?? 0) + 1 ? styles.currentPage : ""}`} onClick={() => handlePageChange((pageNum as number) - 1)} disabled={pageNum === (paging.PageIndex ?? 0) + 1}>
                                                {pageNum}
                                            </button>
                                        )
                                    )}

                                    {/* Spacer between Page Numbers and Next - only if not both ellipses */}
                                    {!hasBothEllipses && <div className={styles.pagingSpacer}></div>}

                                    {/* Next Page Button */}
                                    <button className={`${styles.pagingButton} ${styles.nextButton}`} onClick={handleNextPage} disabled={(paging.PageIndex ?? 0) >= totalPages - 1} title="Next Page">
                                        <Image src="/icons/Chevron.webp" width={0} height={0} alt="Next page" className={styles.chevronRight} unoptimized />
                                    </button>

                                    {/* Last Page Button */}
                                    <button className={`${styles.pagingButton} ${styles.lastButton}`} onClick={handleLastPage} disabled={(paging.PageIndex ?? 0) >= totalPages - 1} title="Last Page">
                                        <Image src="/icons/Chevron.webp" width={0} height={0} alt="Last page" className={styles.doubleChevronRight} unoptimized />
                                        <Image src="/icons/Chevron.webp" width={0} height={0} alt="Last page" className={styles.doubleChevronRight} unoptimized />
                                    </button>
                                </>
                            );
                        })()}
                    </div>
                </div>
            )}

            {/* Page Size Controls - only show if not showAll and more than 10 total items */}
            {!_.showAll && totalCount > 10 && (
                <div className={styles.pageSizeContainer}>
                    <span className={styles.pageSizeText}>Showing</span>
                    <div className={styles.pageSizeBox} onClick={() => setIsPageSizeModalOpen(true)}>
                        {paging.PageSize ?? 10}
                    </div>
                    <span className={styles.pageSizeText}>per page</span>
                </div>
            )}

            {/* Page Size Modal */}
            <JC_Modal title="Page Size" isOpen={isPageSizeModalOpen} onCancel={handlePageSizeModalClose}>
                <div className={styles.pageSizeModalContent}>
                    {getFilteredPageSizeOptions().map(size => (
                        <div
                            key={size}
                            className={`${styles.pageSizeOption} ${size === (paging.PageSize ?? 10) ? styles.currentPageSize : ""}`}
                            onClick={() => {
                                if (size !== (paging.PageSize ?? 10)) {
                                    handlePageSizeChange(size);
                                }
                            }}
                        >
                            {size}
                        </div>
                    ))}
                </div>
            </JC_Modal>
        </div>
    );
}
