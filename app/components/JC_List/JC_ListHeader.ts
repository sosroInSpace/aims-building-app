export interface JC_ListHeader {
    label: string;
    sortKey: string;
    hideOnTeenyTiny?: boolean; // Hide on teeny tiny screens (< 600px)
    hideOnTiny?: boolean; // Hide on tiny screens (< 790px)
    hideOnSmall?: boolean; // Hide on small screens (< 1020px)
    hideOnMedium?: boolean; // Hide on medium screens (< 1360px)
    hideOnLarge?: boolean; // Hide on large screens (> 1500px)
    optionsEditableFields?: string[]; // List of field names that can be edited for options in formList mode
    manualOverrideFields?: { field: string; label: string }[]; // List of field objects that can be manually overridden for this column
    manualEditActionButton?: { label: string; callback: (item: any) => Promise<any> }; // Manual edit action button that returns object to populate manual fields
    wideOptionsColumn?: boolean; // Make the options column wider when this column is selected in formList mode
}
