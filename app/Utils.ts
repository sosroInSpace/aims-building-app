import { LocalStorageKeyEnum } from "./enums/LocalStorageKey";
import { JC_ListPagingModel, JC_ListPagingResultModel } from "./models/ComponentModels/JC_ListPagingModel";
import { _ExtendedField } from "./models/_ExtendedField";
import { _ModelConstructor } from "./models/_ModelRequirements";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { QueryResultRow, sql } from "@vercel/postgres";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { v4 as uuidv4 } from "uuid";
import { isEmail, isMobilePhone } from "validator";

// S3 Client setup
const s3Client = new S3Client({
    region: process.env.AWS_REGION || "ap-southeast-2",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
    }
});

// ----------- //
// - General - //
// ----------- //

export class JC_Utils {
    // Check if URL matches current URL
    static isOnPage(checkUrl?: string) {
        // Check if window is defined (client-side only)
        if (typeof window === "undefined") {
            return false;
        }
        // Extract just the path portion from the URL
        const pathname = window.location.pathname;
        // Remove leading slash if present in the pathname
        const cleanPathname = pathname.startsWith("/") ? pathname.substring(1) : pathname;
        // Compare with the checkUrl (with or without leading slash)
        return cleanPathname === checkUrl || pathname === `/${checkUrl}`;
    }

    // Check if user is on a mobile device
    static isOnMobile() {
        if (typeof navigator === "undefined") {
            return false;
        }
        const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        return isMobileDevice;
    }

    // Get responsive path for GIF WebP images (smaller version on small screens)
    static getResponsiveGifPath(imagePath: string): string {
        // Check if the path ends with "Gif.webp"
        if (imagePath.endsWith("Gif.webp")) {
            // If on mobile, use the small version
            if (JC_Utils.isOnMobile()) {
                // Replace "Gif.webp" with "Gif [Small].webp"
                return imagePath.replace("Gif.webp", "Gif [Small].webp");
            }
        }
        return imagePath;
    }

    // Stringify object then parse it so setState call force trigger rerender
    static parseStringify(theObject: any) {
        return JSON.parse(JSON.stringify(theObject));
    }

    // Random GUID
    static generateGuid() {
        return uuidv4();
    }

    // Format page header title in format: "<customerAddress> - <pageTabName>"
    static formatPageHeaderTitle(customerAddress: string | null | undefined, pageTabName: string): string {
        const formattedAddress = customerAddress && customerAddress.trim() !== "" ? customerAddress : "No Address";
        return `${formattedAddress} - ${pageTabName}`;
    }

    // Check if 2 arrays are equals (does not account for order)
    static arraysEqual(array1: any[], array2: any[]) {
        return array1.length == array2.length && array1.every(x1 => array2.find(x2 => JSON.stringify(x1) == JSON.stringify(x2)));
    }

    // Check if 2 arrays of guid's are equals (does not account for order)
    static guidArraysEqual(array1: string[], array2: string[]) {
        return array1.length == array2.length && array1.every(x1 => array2.find(x2 => JSON.stringify(x1.toLowerCase()) == JSON.stringify(x2.toLowerCase())));
    }

    // Check if string is in a list of strings, ignoring casing
    static stringInListOfStrings(theString: string, theList: string[]) {
        return theList.map(s => s.toLowerCase()).includes(theString.toLowerCase());
    }

    // Convert a list of arrays into a single array
    static flattenArrays(arrays: any[][]) {
        return arrays.flat();
    }

    /**
     * Ensures all items in a list have unique SortOrder values
     * If an item doesn't have a SortOrder, it will be assigned one
     * Ensures there are no gaps larger than 1 between consecutive sort orders
     * @param items List of items to organize
     * @returns The same list with updated SortOrder values
     */
    static organiseSortOrders<T extends { SortOrder?: number }>(items: T[]): T[] {
        if (!items || items.length === 0) {
            return items;
        }

        // First, assign a default SortOrder to any items that don't have one
        let maxSortOrder = 0;
        for (const item of items) {
            if (item.SortOrder !== undefined && item.SortOrder > maxSortOrder) {
                maxSortOrder = item.SortOrder;
            }
        }

        // Assign SortOrder to items that don't have one
        for (const item of items) {
            if (item.SortOrder === undefined) {
                maxSortOrder += 10; // Temporarily use larger increments
                item.SortOrder = maxSortOrder;
            }
        }

        // Check for duplicates and resolve them
        const usedSortOrders = new Map<number, boolean>();
        for (const item of items) {
            if (usedSortOrders.has(item.SortOrder!)) {
                // Found a duplicate, assign a new value
                maxSortOrder += 10;
                item.SortOrder = maxSortOrder;
            }
            usedSortOrders.set(item.SortOrder!, true);
        }

        // Sort the items by their current SortOrder
        const sortedItems = [...items].sort((a, b) => (a.SortOrder || 0) - (b.SortOrder || 0));

        // Reassign SortOrder values with increments of 1
        // If we want to preserve the minimum value, we can start from the minimum existing value
        let minSortOrder = sortedItems[0].SortOrder || 0;

        // Reassign all SortOrder values with increments of exactly 1
        for (let i = 0; i < sortedItems.length; i++) {
            sortedItems[i].SortOrder = minSortOrder + i;
        }

        return items;
    }

    // Check if string not null and not empty
    static stringNullOrEmpty(inString?: string | null) {
        return inString == undefined || inString == null || inString.trim().length == 0;
    }

    // Safe localStorage operations for incognito mode compatibility
    static safeLocalStorageGetItem(key: string): string | null {
        try {
            if (typeof window === "undefined") return null;
            return localStorage.getItem(key);
        } catch (error) {
            console.warn(`Failed to get localStorage item: ${key}`, error);
            return null;
        }
    }

    static safeLocalStorageSetItem(key: string, value: string): boolean {
        try {
            if (typeof window === "undefined") return false;
            localStorage.setItem(key, value);
            return true;
        } catch (error) {
            console.warn(`Failed to set localStorage item: ${key}`, error);
            return false;
        }
    }

    static safeLocalStorageRemoveItem(key: string): boolean {
        try {
            if (typeof window === "undefined") return false;
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.warn(`Failed to remove localStorage item: ${key}`, error);
            return false;
        }
    }

    // Clear all localStorage items based on LocalStorageKeyEnum
    static clearAllLocalStorage() {
        // Check if window is defined (client-side only)
        if (typeof window === "undefined") {
            return;
        }

        try {
            // Iterate through all LocalStorageKeyEnum values
            Object.values(LocalStorageKeyEnum).forEach(key => {
                try {
                    // Remove the main localStorage item
                    localStorage.removeItem(key);
                    // Also remove any associated reset time items (used by JC_GetList caching)
                    localStorage.removeItem(`${key}_ResetTime`);
                } catch (error) {
                    console.warn(`Failed to remove localStorage item: ${key}`, error);
                }
            });

            // Also clear all model-based cache entries (created by JC_Get and JC_GetList)
            // These have table names as prefixes (e.g., "Customer_", "O_Weather_", etc.)
            const keysToRemove: string[] = [];
            try {
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key) {
                        // Check if this looks like a model cache entry (contains underscore and ends with _ResetTime or is a cache entry)
                        if (key.includes("_") && (key.endsWith("_ResetTime") || this.isModelCacheKey(key))) {
                            keysToRemove.push(key);
                        }
                    }
                }
            } catch (error) {
                console.warn("Failed to enumerate localStorage keys", error);
            }

            // Remove all model cache keys
            keysToRemove.forEach(key => {
                try {
                    localStorage.removeItem(key);
                } catch (error) {
                    console.warn(`Failed to remove model cache key: ${key}`, error);
                }
            });

            if (keysToRemove.length > 0) {
                console.log(`Cleared ${keysToRemove.length} model cache entries from localStorage`);
            }
        } catch (error) {
            console.warn("Failed to clear localStorage - this may be due to incognito mode restrictions", error);
        }
    }

    /**
     * Helper method to determine if a localStorage key is a model cache entry
     * Model cache keys typically follow the pattern: TableName_routeName[_params][_paging]
     */
    private static isModelCacheKey(key: string): boolean {
        // Skip keys that are already in LocalStorageKeyEnum
        if (Object.values(LocalStorageKeyEnum).includes(key as any)) {
            return false;
        }

        // Skip keys that end with _ResetTime (these are handled separately)
        if (key.endsWith("_ResetTime")) {
            return false;
        }

        // Model cache keys typically have at least one underscore and don't start with common prefixes
        return (
            key.includes("_") &&
            !key.startsWith("JC_") && // LocalStorageKeyEnum items start with JC_
            !key.startsWith("_") && // Don't start with underscore
            key.length > 3
        ); // Reasonable minimum length
    }

    /**
     * Clears all localStorage entries that start with the given table name prefix
     * This is used to invalidate cache after Create, Update, or Delete operations
     * @param tableName The table name to clear cache for (e.g., "Customer", "CustomerDefect")
     * @param modelInstance Optional model instance to also clear cache for referenced models in ExtendedFields
     */
    static clearLocalStorageForTable(tableName: string, modelInstance?: any): void {
        // Check if window is defined (client-side only)
        if (typeof window === "undefined") {
            return;
        }

        const tablesToClear = new Set<string>([tableName]);

        // If model instance is available, also clear cache for all referenced models
        if (modelInstance && modelInstance.ExtendedFields && Array.isArray(modelInstance.ExtendedFields)) {
            modelInstance.ExtendedFields.forEach((field: any) => {
                if (field.ReferenceModel && field.ReferenceModel.tableName) {
                    tablesToClear.add(field.ReferenceModel.tableName);
                }
            });
        }

        let totalKeysRemoved = 0;

        // Clear localStorage for each table
        tablesToClear.forEach(table => {
            const prefix = `${table}_`;
            const keysToRemove: string[] = [];

            // Find all localStorage keys that start with the table prefix
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(prefix)) {
                    keysToRemove.push(key);
                }
            }

            // Remove all matching keys
            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
            });

            if (keysToRemove.length > 0) {
                console.log(`Cleared ${keysToRemove.length} cache entries for table: ${table}`);
                totalKeysRemoved += keysToRemove.length;
            }
        });

        if (totalKeysRemoved > 0 && tablesToClear.size > 1) {
            console.log(`Total cache entries cleared: ${totalKeysRemoved} across ${tablesToClear.size} tables`);
        }
    }

    // Round to 2dp and cut off 0's
    static roundAndCutZeroes(num: number, dp: number) {
        if (num == null || num == 0) {
            return 0;
        }
        const newNum = parseFloat(num?.toFixed(dp));
        return Math.round(newNum * 100) / 100;
    }

    // See if search string split by words matches other string
    static searchMatches(searchString: string, checkString: string) {
        let searchWords: string[] = searchString?.toLowerCase().trim().split(" ");
        return searchWords.every(word => checkString.toLowerCase().indexOf(word) > -1);
    }

    // Toast
    static showToastError(text: string) {
        toast.error(text, {
            position: "bottom-right",
            style: { whiteSpace: "pre-line" }
        });
    }
    static showToastWarning(text: string) {
        toast.warning(text, {
            position: "bottom-right",
            style: { whiteSpace: "pre-line" }
        });
    }
    static showToastSuccess(text: string) {
        toast.success(text, {
            position: "bottom-right",
            style: { whiteSpace: "pre-line" }
        });
    }
    static showToastInfo(text: string) {
        toast.info(text, {
            position: "bottom-right",
            style: { whiteSpace: "pre-line" }
        });
    }

    // Sleep
    static async sleep(seconds: number) {
        return new Promise(r => setTimeout(r, seconds * 1000));
    }

    // Hardcoded list of sound files in public/sounds directory
    private static soundFiles: string[] = [
        "Ahawhaw, My God.wav",
        "Ahhh1.wav",
        "Ahhh2.wav",
        "Ahhh3.wav",
        "Aww, He's Too Busy Lookign At The Dick Head In Front.wav",
        "Aww, You Got All Black Bitches. How I Am I Suppose To Win.wav",
        "Awww, Fuck.wav",
        "Ay, Yeah, Pass It To Him.wav",
        "Ayyaaahh0.wav",
        "Ayyaaahh1.wav",
        "Beautiful...Ahhh.wav",
        "Can't Even Get Past Your Stupid Defence.wav",
        "Eheeeeeh.wav",
        "Ffff, They're Too Black And Fast.wav",
        "For Fuck's Sake.wav",
        "Fuck Off, Chris. Just Fuck Off.wav",
        "Fuck Off, Chris.wav",
        "Fuck's Sake0.wav",
        "Fuck's Sake1.wav",
        "Fuck0.wav",
        "Fuck1.wav",
        "Fuckin faggot.wav",
        "Hahaha.wav",
        "Heeee.wav",
        "I can't do this shit! Ahh!.wav",
        "I Can't Do This.wav",
        "I can't even fucking beat a fucking retard.wav",
        "I Can't Handle This, Chris.wav",
        "I Cant' Get Passed You.wav",
        "I hate this game, it's so shit.wav",
        "I'm losing to a fucking retard.wav",
        "I'm Playing Like Absolute Shit.wav",
        "It gives me shit.wav",
        "mmmm, mmmm, MMM MMM.wav",
        "Moan0.wav",
        "Moan1.wav",
        "Nooo, Nooo.wav",
        "Nooo0.wav",
        "Nooo1.wav",
        "Oh My God.wav",
        "Ohhh now I gotta oooo ahhhh.wav",
        "Ohhhh Nooooo.wav",
        "Ohhhh.wav",
        "Saaay eehh.wav",
        "See How Slow He Was Moving.wav",
        "That Is Crap.wav",
        "This Is Absolute Horse Shit.wav",
        "This is fucked.wav",
        "This Is Fucking Crap.wav",
        "Wawaweewa.wav",
        "What Am I Supposed To Do.wav",
        "Woo.wav",
        "Yeah, Fucking Fantastic.wav",
        "Yeah, Why Dont' You Pass It There. That's A Good Idea.wav"
    ];

    // Play a random sound from the public/sounds directory
    static playRandomSound() {
        try {
            if (this.soundFiles.length === 0) {
                console.error("No sound files found");
                return;
            }

            // Select a random sound file
            const randomIndex = Math.floor(Math.random() * this.soundFiles.length);
            const soundFile = this.soundFiles[randomIndex];

            // Create and play the audio
            const audio = new Audio(`/sounds/${soundFile}`);
            audio.play();
        } catch (error) {
            console.error("Error playing sound:", error);
        }
    }

    // Check if an element is near the center of the screen
    static isElementNearScreenCenter(element: HTMLElement, thresholdPercent: number = 0.2): { isNearCenter: boolean; position: "above" | "center" | "below" } {
        if (!element) return { isNearCenter: false, position: "below" };

        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const elementCenter = rect.top + rect.height / 2;
        const windowCenter = windowHeight / 2;

        // Calculate how close the element is to the center (as a percentage of window height)
        const distanceFromCenter = Math.abs(elementCenter - windowCenter) / windowHeight;

        // Determine if element is above, at, or below center
        let position: "above" | "center" | "below";
        if (elementCenter < windowCenter - windowHeight * thresholdPercent) {
            position = "above";
        } else if (elementCenter > windowCenter + windowHeight * thresholdPercent) {
            position = "below";
        } else {
            position = "center";
        }

        // Check if element is within the threshold percentage of the center
        const isNearCenter = distanceFromCenter < thresholdPercent;

        return { isNearCenter, position };
    }

    // Eg. "productVariation" -> "Product Variations"
    static routeNameToDescription(routeName: string) {
        if (routeName.indexOf("/") >= 0) {
            return routeName;
        } else {
            const result = routeName.replace(/([A-Z])/g, " $1");
            return result.charAt(0).toUpperCase() + result.slice(1) + "s";
        }
    }

    static getNumOrdinal(num: number) {
        if (num.toString().split(".")[0].slice(-2)[0] == "1") {
            return "th";
        }
        switch (num % 10) {
            case 1:
                return "st";
            case 2:
                return "nd";
            case 3:
                return "rd";
            default:
                return "th";
        }
    }
}

// --------- //
// - DATES - //
// --------- //

export class JC_Utils_Dates {
    // Get number of minutes between 2 dates
    static minutesBetweenDates(inDate1: Date, inDate2: Date) {
        let date1 = new Date(inDate1);
        let date2 = new Date(inDate2);
        let msBetween = Math.abs(date1.getTime() - date2.getTime());
        const minutesBetween = msBetween / (60 * 1000);
        return minutesBetween;
    }

    // Get formatted date string
    static formattedDateString(inDate: Date) {
        let theDate = new Date(inDate);
        let dateNum = theDate.getDate();
        let ordinal = JC_Utils.getNumOrdinal(dateNum);
        let monthLong = theDate.toLocaleString("default", { month: "long" });
        let year = theDate.getFullYear();
        return `${dateNum}${ordinal} ${monthLong} ${year}`;
    }

    // Format Date object for Postgres timestamp
    static formatDateForPostgres(inDate: Date) {
        const year = inDate.getFullYear();
        const month = (inDate.getMonth() + 1).toString().padStart(2, "0");
        const day = inDate.getDate().toString().padStart(2, "0");
        const hours = inDate.getHours().toString().padStart(2, "0");
        const minutes = inDate.getMinutes().toString().padStart(2, "0");
        const seconds = inDate.getSeconds().toString().padStart(2, "0");
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    // Format date as DD/MM/YY
    static formatDateShort(inDate: Date) {
        const theDate = new Date(inDate);
        const day = theDate.getDate().toString().padStart(2, "0");
        const month = (theDate.getMonth() + 1).toString().padStart(2, "0");
        const year = theDate.getFullYear().toString().slice(-2);
        return `${day}/${month}/${year}`;
    }

    // Format date as DD/MM/YYYY
    static formatDateFull(inDate: Date) {
        const theDate = new Date(inDate);
        const day = theDate.getDate().toString().padStart(2, "0");
        const month = (theDate.getMonth() + 1).toString().padStart(2, "0");
        const year = theDate.getFullYear();
        return `${day}/${month}/${year}`;
    }

    // Convert date to timezone-safe date for form handling
    // Sets time to noon to avoid timezone boundary issues
    static toTimezoneSafeDate(value: Date | string | undefined): Date | undefined {
        if (!value) return undefined;

        if (value instanceof Date) {
            return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 12, 0, 0);
        } else if (typeof value === "string") {
            const parts = value.split("-");
            if (parts.length === 3) {
                const year = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1; // JS months are 0-based
                const day = parseInt(parts[2], 10);
                return new Date(year, month, day, 12, 0, 0); // Noon local time
            }
            return new Date(value); // fallback
        }

        return undefined;
    }

    // Format date as "Tues, 18 Feb 2025" for inspection reports
    static formatInspectionDate(date: Date): string {
        const dayNames = ["Sun", "Mon", "Tues", "Wed", "Thu", "Fri", "Sat"];
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        const dayName = dayNames[date.getDay()];
        const day = date.getDate();
        const monthName = monthNames[date.getMonth()];
        const year = date.getFullYear();

        return `${dayName}, ${day} ${monthName} ${year}`;
    }
}

// ------------ //
// - BUSINESS - //
// ------------ //

export class JC_Utils_Business {
    // Generic Get function for single record retrieval
    static async sqlGet<T extends QueryResultRow>(modelConstructor: _ModelConstructor<T>, pkValue: string, filterDeleted: boolean = true): Promise<T> {
        // Get extended fields from a temporary instance of the model
        const tempInstance = new modelConstructor();
        const extendedFields = tempInstance.ExtendedFields;

        // Build JOIN clauses and SELECT fields for extended fields
        const { joinClauses, selectFields } = this.buildExtendedFieldsQuery(extendedFields);

        const query = `
            SELECT ${selectFields}
            FROM public."${modelConstructor.tableName}" main
            ${joinClauses}
            WHERE main."${modelConstructor.primaryKey}" = $1
            ${filterDeleted ? `AND main."Deleted" = 'False'` : ""}
        `;

        let result = new modelConstructor((await sql.query(query, [pkValue])).rows[0]) as T;

        // Process setWithCallback fields
        if (extendedFields && extendedFields.length > 0) {
            const resultArray = await this.processSetWithCallbackFields([result], extendedFields);
            result = resultArray[0];
        }

        return result;
    }

    // Generic ItemExists function for checking if record exists
    static async sqlItemExists<T extends QueryResultRow>(modelConstructor: _ModelConstructor<T>, pkValue: string, filterDeleted: boolean = true): Promise<boolean> {
        const query = `
            SELECT COUNT(*) as count
            FROM public."${modelConstructor.tableName}"
            WHERE "${modelConstructor.primaryKey}" = $1
            ${filterDeleted ? `AND "Deleted" = 'False'` : ""}
        `;
        const result = await sql.query(query, [pkValue]);
        return parseInt(result.rows[0].count) > 0;
    }

    // Generic Delete function for single record soft deletion
    static async sqlDelete<T extends QueryResultRow>(modelConstructor: _ModelConstructor<T>, pkValue: string): Promise<void> {
        const query = `
            UPDATE public."${modelConstructor.tableName}"
            SET "Deleted" = $1,
                "ModifiedAt" = $2
            WHERE "${modelConstructor.primaryKey}" = $3
        `;

        await sql.query(query, ["True", new Date().toUTCString(), pkValue]);
    }

    // Generic SQL pagination function with dynamic sorting
    static async sqlGetList<T extends QueryResultRow>(modelConstructor: _ModelConstructor<T>, whereClause?: string, paging?: JC_ListPagingModel, filterDeleted: boolean = true): Promise<JC_ListPagingResultModel<T>> {
        // Get extended fields from a temporary instance of the model
        const tempInstance = new modelConstructor();
        const extendedFields = tempInstance.ExtendedFields;

        // Build WHERE clause combining whereClause, filterDeleted, and search
        let combinedWhereClause = "";
        const conditions: string[] = [];
        if (whereClause) {
            conditions.push(whereClause);
        }
        if (filterDeleted) {
            conditions.push(`main."Deleted" = 'False'`);
        }

        // Add search conditions if search text and fields are provided
        if (paging && paging.SearchText && paging.SearchFields && paging.SearchFields.length > 0) {
            const searchText = paging.SearchText.trim();
            if (searchText.length > 0) {
                // Validate search fields against model keys for security
                const validFields = paging.SearchFields.filter(
                    field => modelConstructor.getKeys().includes(field) && /^[a-zA-Z0-9_]+$/.test(field) // Only allow safe field names
                );

                if (validFields.length > 0) {
                    // Split search text by spaces to get individual words
                    const searchWords = searchText.split(" ").filter(word => word.trim().length > 0);

                    const searchConditions = validFields.map(field => {
                        // Check if this is an extended field and get its details
                        const extendedFieldIndex = extendedFields ? extendedFields.findIndex((extField: _ExtendedField) => extField.Name === field) : -1;

                        // Create conditions for each word in the search text
                        const wordConditions = searchWords.map(word => {
                            const escapedWord = word.replace(/'/g, "''");

                            if (extendedFieldIndex >= 0 && extendedFields) {
                                // For extended fields, search in the alias table with the reference field
                                const extendedField = extendedFields[extendedFieldIndex];
                                const alias = `ref${extendedFieldIndex}`;
                                const referenceField = extendedField.ReferenceField || extendedField.ReferenceModel.primaryDisplayField;
                                return `${alias}."${referenceField}" ILIKE '%${escapedWord}%'`;
                            } else {
                                // For regular fields, search in the main table
                                return `main."${field}" ILIKE '%${escapedWord}%'`;
                            }
                        });

                        // Join word conditions with OR (any word can match in this field)
                        return `(${wordConditions.join(" OR ")})`;
                    });

                    // Join field conditions with OR (any field can match)
                    conditions.push(`(${searchConditions.join(" OR ")})`);
                }
            }
        }

        if (conditions.length > 0) {
            combinedWhereClause = `WHERE ${conditions.join(" AND ")}`;
        }

        // Build JOIN clauses and SELECT fields for extended fields
        const { joinClauses, selectFields } = this.buildExtendedFieldsQuery(extendedFields);

        // Build base query
        const baseQuery = `
            SELECT ${selectFields}
            FROM public."${modelConstructor.tableName}" main
            ${joinClauses}
            ${combinedWhereClause}
        `;

        // Check if paging should be ignored (when either PageIndex or PageSize is empty or NaN)
        const shouldIgnorePaging = !paging || paging.PageSize === null || paging.PageSize === undefined || paging.PageSize === 0 || isNaN(paging.PageSize) || paging.PageIndex === null || paging.PageIndex === undefined || isNaN(paging.PageIndex);

        // Check if sorting should be ignored (independent of paging)
        const shouldIgnoreSorting = !paging || !paging.Sorts || paging.Sorts.length === 0;

        // Build ORDER BY clause for multiple sorts
        let orderQuery = "";
        let shouldSortInTypeScript = false;
        let typeScriptSorts: { field: string; asc: boolean }[] = [];

        if (!shouldIgnoreSorting) {
            const orderClauses: string[] = [];

            for (const sort of paging.Sorts!) {
                if (!sort.SortField || sort.SortAsc === undefined || !modelConstructor.getKeys().includes(sort.SortField)) {
                    continue; // Skip invalid sorts
                }

                // Additional security: ensure field name only contains safe characters
                const safeFieldName = sort.SortField.replace(/[^a-zA-Z0-9_]/g, "");
                if (safeFieldName !== sort.SortField || safeFieldName.length === 0) {
                    continue; // Skip unsafe field names
                }

                const sortDirection = sort.SortAsc ? "ASC" : "DESC";
                const nullsClause = sort.nullsFirst !== undefined ? (sort.nullsFirst ? (sort.SortAsc ? "NULLS FIRST" : "NULLS LAST") : sort.SortAsc ? "NULLS LAST" : "NULLS FIRST") : "";

                // Check if this is an extended field and get its details
                const extendedFieldIndex = extendedFields ? extendedFields.findIndex((field: _ExtendedField) => field.Name === safeFieldName) : -1;

                if (extendedFieldIndex >= 0 && extendedFields) {
                    const extendedField = extendedFields[extendedFieldIndex];

                    // If this extended field has setWithCallback, we'll sort in TypeScript after processing
                    if (extendedField.setWithCallback) {
                        shouldSortInTypeScript = true;
                        typeScriptSorts.push({ field: safeFieldName, asc: sort.SortAsc });
                    } else {
                        // For extended fields without setWithCallback, sort by the alias and reference field from the JOIN
                        const alias = `ref${extendedFieldIndex}`;
                        const referenceField = extendedField.ReferenceField || extendedField.ReferenceModel.primaryDisplayField;
                        const fullSortClause = `${alias}."${referenceField}" ${sortDirection}${nullsClause ? " " + nullsClause : ""}`;
                        orderClauses.push(fullSortClause);
                    }
                } else {
                    // For regular fields, sort by the main table field
                    const fullSortClause = `main."${safeFieldName}" ${sortDirection}${nullsClause ? " " + nullsClause : ""}`;
                    orderClauses.push(fullSortClause);
                }
            }

            if (orderClauses.length > 0) {
                orderQuery = `ORDER BY ${orderClauses.join(", ")}`;
            }
        }

        if (shouldIgnorePaging) {
            // Return all results without paging
            const finalQuery = `${baseQuery} ${orderQuery}`;
            let resultList = (await sql.query(finalQuery)).rows.map(r => new modelConstructor(r)) as T[];

            // Process setWithCallback fields
            resultList = await this.processSetWithCallbackFields(resultList, extendedFields);

            // Sort in TypeScript if needed
            if (shouldSortInTypeScript && typeScriptSorts.length > 0) {
                resultList = this.sortResultsInTypeScriptMultiple(resultList, typeScriptSorts);
            }

            return {
                ResultList: resultList,
                TotalCount: 0,
                TotalPages: 0
            };
        }

        // Apply paging
        const offset = (paging.PageIndex ?? 0) * (paging.PageSize ?? 20);
        const finalQuery = `${baseQuery} ${orderQuery} LIMIT $1 OFFSET $2`;
        const finalValues = [paging.PageSize, offset];

        // Get the paginated results
        let resultList = (await sql.query(finalQuery, finalValues)).rows.map(r => new modelConstructor(r)) as T[];

        // Process setWithCallback fields
        resultList = await this.processSetWithCallbackFields(resultList, extendedFields);

        // Sort in TypeScript if needed
        if (shouldSortInTypeScript && typeScriptSorts.length > 0) {
            resultList = this.sortResultsInTypeScriptMultiple(resultList, typeScriptSorts);
        }

        // Get total count using the same WHERE clause
        const countQuery = `
            SELECT COUNT(*) as total
            FROM public."${modelConstructor.tableName}" main
            ${joinClauses}
            ${combinedWhereClause}
        `;
        const countResult = await sql.query(countQuery);
        const totalCount = parseInt(countResult.rows[0].total);
        const totalPages = Math.ceil(totalCount / (paging.PageSize ?? 20));

        return {
            ResultList: resultList,
            TotalCount: totalCount,
            TotalPages: totalPages
        };
    }

    // Build JOIN clauses and SELECT fields for extended fields
    private static buildExtendedFieldsQuery(extendedFields?: _ExtendedField[]): {
        joinClauses: string;
        selectFields: string;
    } {
        let joinClauses = "";
        let selectFields = `main.*`;

        if (extendedFields && extendedFields.length > 0) {
            const joins: string[] = [];
            const additionalSelects: string[] = [];

            extendedFields.forEach((field: _ExtendedField, index: number) => {
                // Skip extended fields that have setWithCallback - they will be processed after SQL query
                if (field.setWithCallback) {
                    return;
                }

                const alias = `ref${index}`;
                const referenceField = field.ReferenceField || field.ReferenceModel.primaryDisplayField;

                // Use the FromField property to determine the foreign key field name
                const foreignKeyField = field.FromField;

                joins.push(`
                    LEFT JOIN public."${field.ReferenceModel.tableName}" ${alias}
                    ON main."${foreignKeyField}" = ${alias}."${field.ReferenceModel.primaryKey}"`);

                additionalSelects.push(`${alias}."${referenceField}" AS "${field.Name}"`);
            });

            joinClauses = joins.join("");
            if (additionalSelects.length > 0) {
                selectFields += ", " + additionalSelects.join(", ");
            }
        }

        return { joinClauses, selectFields };
    }

    // Process setWithCallback fields for extended fields
    private static async processSetWithCallbackFields<T extends QueryResultRow>(resultList: T[], extendedFields?: _ExtendedField[]): Promise<T[]> {
        if (!extendedFields || extendedFields.length === 0) {
            return resultList;
        }

        // Find extended fields that have setWithCallback
        const callbackFields = extendedFields.filter(field => field.setWithCallback);

        if (callbackFields.length === 0) {
            return resultList;
        }

        // Process each result item
        for (const item of resultList) {
            for (const field of callbackFields) {
                if (field.setWithCallback) {
                    // Call the setWithCallback function and set the extended field value
                    const value = await field.setWithCallback(item);
                    (item as any)[field.Name] = value;
                }
            }
        }

        return resultList;
    }

    // Sort results in TypeScript for setWithCallback fields
    private static sortResultsInTypeScript<T extends QueryResultRow>(resultList: T[], sortField: string, sortAsc: boolean): T[] {
        return resultList.sort((a, b) => {
            const aValue = (a as any)[sortField];
            const bValue = (b as any)[sortField];

            // Handle null/undefined values
            if (aValue == null && bValue == null) return 0;
            if (aValue == null) return sortAsc ? -1 : 1;
            if (bValue == null) return sortAsc ? 1 : -1;

            // Compare values
            let comparison = 0;
            if (typeof aValue === "string" && typeof bValue === "string") {
                comparison = aValue.localeCompare(bValue);
            } else if (typeof aValue === "number" && typeof bValue === "number") {
                comparison = aValue - bValue;
            } else {
                // Convert to strings for comparison
                comparison = String(aValue).localeCompare(String(bValue));
            }

            return sortAsc ? comparison : -comparison;
        });
    }

    // Sort results in TypeScript for multiple fields (for setWithCallback fields)
    private static sortResultsInTypeScriptMultiple<T extends QueryResultRow>(resultList: T[], sorts: { field: string; asc: boolean }[]): T[] {
        return resultList.sort((a, b) => {
            for (const sort of sorts) {
                const aValue = (a as any)[sort.field];
                const bValue = (b as any)[sort.field];

                // Handle null/undefined values
                if (aValue == null && bValue == null) continue;
                if (aValue == null) return sort.asc ? -1 : 1;
                if (bValue == null) return sort.asc ? 1 : -1;

                // Compare values
                let comparison = 0;
                if (typeof aValue === "string" && typeof bValue === "string") {
                    comparison = aValue.localeCompare(bValue);
                } else if (typeof aValue === "number" && typeof bValue === "number") {
                    comparison = aValue - bValue;
                } else {
                    // Convert to strings for comparison
                    comparison = String(aValue).localeCompare(String(bValue));
                }

                if (comparison !== 0) {
                    return sort.asc ? comparison : -comparison;
                }
            }
            return 0; // All fields are equal
        });
    }

    // Extract paging parameters from URL searchParams
    static getPagingFromParams(searchParams: URLSearchParams, modelConstructor: { primaryDisplayField: string }): JC_ListPagingModel | undefined {
        let pageSize = searchParams.get("PageSize");

        if (!pageSize) {
            return undefined;
        }

        // Parse SearchFields from comma-separated string
        const searchFieldsParam = searchParams.get("SearchFields");
        const searchFields = searchFieldsParam ? searchFieldsParam.split(",").filter(field => field.trim().length > 0) : undefined;

        // Build sorts array from URL parameters
        let sorts: { SortField?: string; SortAsc?: boolean }[] = [];

        // First, try to get sorts from the new Sorts parameter (JSON array)
        const sortsParam = searchParams.get("Sorts");
        if (sortsParam) {
            try {
                sorts = JSON.parse(sortsParam);
            } catch (error) {
                console.error("Error parsing Sorts parameter:", error);
                sorts = [];
            }
        }

        // If no sorts from JSON parameter, fall back to legacy SortField/SortAsc parameters
        if (sorts.length === 0) {
            const sortField = searchParams.get("SortField") || modelConstructor.primaryDisplayField;
            const sortAsc = (searchParams.get("SortAsc") || "true").toLowerCase() !== "false";

            if (sortField) {
                sorts.push({ SortField: sortField, SortAsc: sortAsc });
            }
        }

        return {
            PageSize: searchParams.get("PageSize") ? parseInt(searchParams.get("PageSize")!) : 50,
            PageIndex: searchParams.get("PageIndex") ? parseInt(searchParams.get("PageIndex")!) : 0,
            Sorts: sorts,
            SearchText: searchParams.get("SearchText") || undefined,
            SearchFields: searchFields
        };
    }
}

// --------- //
// - FILES - //
// --------- //

export class JC_Utils_Files {
    static defaultSignedUrlExpiry = 60 * 5; // 5 minutes

    // Upload file buffer to S3
    static async uploadFile({ buffer, key, contentType }: { buffer: Buffer; key: string; contentType: string }): Promise<void> {
        const command = new PutObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: key,
            Body: buffer,
            ContentType: contentType
        });

        await s3Client.send(command);
    }

    // Get a signed download URL for a file
    static async getSignedUrlForKey(key: string, expiresInSeconds: number = this.defaultSignedUrlExpiry): Promise<string> {
        const command = new GetObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: key
        });
        return await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
    }

    // Get a signed upload URL for a file
    static async getSignedUrlForUpload(key: string, contentType: string, expiresInSeconds: number = this.defaultSignedUrlExpiry): Promise<string> {
        const command = new PutObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: key,
            ContentType: contentType
        });

        return await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
    }

    // Delete file from S3
    static async deleteFile(key: string): Promise<void> {
        const command = new DeleteObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: key
        });

        await s3Client.send(command);
    }

    // Upload PDF to S3 and return signed URL with 30-day expiry
    static async uploadPdfAndGetSignedUrl(
        pdfBase64: string,
        key: string,
        expiresInSeconds: number = 7 * 24 * 60 * 59 // 30 days
    ): Promise<string> {
        // Upload PDF to S3
        const buffer = this.base64ToBuffer(pdfBase64);
        await this.uploadFile({
            buffer,
            key,
            contentType: "application/pdf"
        });

        // Get signed URL with specified expiry
        return await this.getSignedUrlForKey(key, expiresInSeconds);
    }

    // Get file extension from MIME type (fallback based)
    static getExtensionFromMime(mimeType: string): string {
        const map: Record<string, string> = {
            "application/pdf": "pdf",
            "text/csv": "csv",
            "image/jpeg": "jpg",
            "image/png": "png",
            "image/webp": "webp",
            "application/zip": "zip",
            "application/json": "json"
        };

        return map[mimeType] ?? "bin";
    }

    // Convert base64 string to buffer
    static base64ToBuffer(base64: string): Buffer {
        const clean = base64.includes(",") ? base64.split(",")[1] : base64;
        return Buffer.from(clean, "base64");
    }

    // Calculate file size in bytes from base64 string
    static calculateBase64FileSize(base64: string): number {
        const buffer = this.base64ToBuffer(base64);
        return buffer.length;
    }

    // Calculate file size in MB from base64 string
    static calculateBase64FileSizeMB(base64: string): number {
        const sizeBytes = this.calculateBase64FileSize(base64);
        return sizeBytes / (1024 * 1024);
    }

    // Upload file directly to S3 using signed URL (front-end function)
    static async uploadFileWithSignedUrl(url: string, base64: string, contentType: string): Promise<void> {
        const buffer = this.base64ToBuffer(base64);

        const response = await fetch(url, {
            method: "PUT",
            body: new Uint8Array(buffer),
            headers: {
                "Content-Type": contentType
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to upload file: ${response.statusText}`);
        }
    }

    // Convert image from path to base64
    static async imageToBase64(imagePath: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            // Check if we're in a browser environment
            if (typeof window === "undefined") {
                reject(new Error("imageToBase64 can only be used in browser environment"));
                return;
            }

            const img = new Image(0, 0);
            img.crossOrigin = "anonymous";

            img.onload = () => {
                try {
                    const canvas = document.createElement("canvas");
                    const ctx = canvas.getContext("2d");

                    if (!ctx) {
                        reject(new Error("Could not get canvas context"));
                        return;
                    }

                    canvas.width = img.naturalWidth;
                    canvas.height = img.naturalHeight;
                    ctx.drawImage(img, 0, 0);

                    const dataUrl = canvas.toDataURL("image/webp", 0.8);
                    resolve(dataUrl);
                } catch (error) {
                    reject(new Error(`Error converting image to base64: ${error}`));
                }
            };

            img.onerror = () => reject(new Error(`Failed to load image from path: ${imagePath}`));
            img.src = imagePath;
        });
    }

    // Get random image from picsum via API route and return as base64
    static async getRandomImage(): Promise<string> {
        try {
            // Check if we're in a browser environment
            if (typeof window === "undefined") {
                throw new Error("getRandomImage can only be used in browser environment");
            }

            // Call our API route to get the random image
            const response = await fetch("/api/image/getRandomImage");
            const data = await response.json();

            if (data.success && data.result) {
                return data.result;
            } else {
                throw new Error("Failed to get random image from API");
            }
        } catch (error) {
            // If API fails, try to fallback to the original default image
            console.warn("Random image API unavailable, falling back to default image:", error);
            try {
                return await this.imageToBase64("/CameraDefaultImage.webp");
            } catch (fallbackError) {
                throw new Error("Failed to load random image and fallback image");
            }
        }
    }

    // Resize base64 image to specific dimensions
    static async resizeBase64Image(base64Image: string, targetWidth: number, targetHeight: number): Promise<string> {
        return new Promise((resolve, reject) => {
            try {
                // Check if we're in a browser environment
                if (typeof window === "undefined") {
                    reject(new Error("resizeBase64Image can only be used in browser environment"));
                    return;
                }

                const img = new Image();
                img.crossOrigin = "anonymous";

                img.onload = () => {
                    try {
                        const canvas = document.createElement("canvas");
                        const ctx = canvas.getContext("2d");

                        if (!ctx) {
                            reject(new Error("Could not get canvas context"));
                            return;
                        }

                        // Set canvas dimensions to target size
                        canvas.width = targetWidth;
                        canvas.height = targetHeight;

                        // Calculate scaling to fit image into target dimensions while maintaining aspect ratio
                        const imageAspectRatio = img.naturalWidth / img.naturalHeight;
                        const targetAspectRatio = targetWidth / targetHeight;

                        let drawWidth, drawHeight, drawX, drawY;

                        if (imageAspectRatio > targetAspectRatio) {
                            // Image is wider than target - fit by height
                            drawHeight = targetHeight;
                            drawWidth = drawHeight * imageAspectRatio;
                            drawX = (targetWidth - drawWidth) / 2;
                            drawY = 0;
                        } else {
                            // Image is taller than target - fit by width
                            drawWidth = targetWidth;
                            drawHeight = drawWidth / imageAspectRatio;
                            drawX = 0;
                            drawY = (targetHeight - drawHeight) / 2;
                        }

                        // Fill canvas with black background
                        ctx.fillStyle = "#000000";
                        ctx.fillRect(0, 0, targetWidth, targetHeight);

                        // Draw image to canvas with proper scaling
                        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

                        // Convert canvas to base64 with lower quality
                        const resizedBase64 = canvas.toDataURL("image/webp", 0.4);
                        resolve(resizedBase64);
                    } catch (error) {
                        reject(new Error(`Error resizing image: ${error}`));
                    }
                };

                img.onerror = () => reject(new Error("Failed to load base64 image"));
                img.src = base64Image;
            } catch (error) {
                reject(new Error(`Error in resizeBase64Image: ${error}`));
            }
        });
    }

    // Take photo using camera or call callback if no camera detected
    static async takePhoto(noDeviceDetectedCallback?: () => Promise<string | null>): Promise<string | null> {
        // Check if we're in a browser environment
        if (typeof window === "undefined" || typeof navigator === "undefined") {
            console.error("takePhoto can only be used in browser environment");
            return null;
        }

        try {
            // Check if camera is available
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                // Try to access camera
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: "environment" // Prefer back camera on mobile
                    }
                });

                // Create video element to capture photo
                const video = document.createElement("video");
                video.srcObject = stream;
                video.autoplay = true;
                video.playsInline = true;

                // Wait for video to be ready
                await new Promise<void>(resolve => {
                    video.onloadedmetadata = () => {
                        resolve();
                    };
                });

                // Create canvas to capture frame
                const canvas = document.createElement("canvas");
                const context = canvas.getContext("2d");

                if (!context) {
                    stream.getTracks().forEach(track => track.stop());
                    throw new Error("Could not get canvas context");
                }

                // Set canvas dimensions to 800x600 for consistent image size
                canvas.width = 800;
                canvas.height = 600;

                // Calculate scaling to fit video into 800x600 while maintaining aspect ratio
                const videoAspectRatio = video.videoWidth / video.videoHeight;
                const targetAspectRatio = 800 / 600;

                let drawWidth, drawHeight, drawX, drawY;

                if (videoAspectRatio > targetAspectRatio) {
                    // Video is wider than target - fit by height
                    drawHeight = 600;
                    drawWidth = drawHeight * videoAspectRatio;
                    drawX = (800 - drawWidth) / 2;
                    drawY = 0;
                } else {
                    // Video is taller than target - fit by width
                    drawWidth = 800;
                    drawHeight = drawWidth / videoAspectRatio;
                    drawX = 0;
                    drawY = (600 - drawHeight) / 2;
                }

                // Fill canvas with black background
                context.fillStyle = "#000000";
                context.fillRect(0, 0, 800, 600);

                // Draw current video frame to canvas with proper scaling
                context.drawImage(video, drawX, drawY, drawWidth, drawHeight);

                // Stop camera stream
                stream.getTracks().forEach(track => track.stop());

                // Convert canvas to base64
                const base64Image = canvas.toDataURL("image/jpeg", 0.8);
                return base64Image;
            } else {
                // No camera available, call callback if provided
                if (noDeviceDetectedCallback) {
                    return await noDeviceDetectedCallback();
                }
                return null;
            }
        } catch (error) {
            console.error("Error accessing camera:", error);
            // Camera access failed, call callback if provided
            if (noDeviceDetectedCallback) {
                return await noDeviceDetectedCallback();
            }
            return null;
        }
    }
}

// -------------- //
// - VALIDATION - //
// -------------- //

export class JC_Utils_Validation {
    static validEmail(inEmail: string) {
        return isEmail(inEmail);
    }

    static validPhone(inPhone: string) {
        return isMobilePhone(inPhone);
    }

    // Main password validation - checks all requirements
    static validPassword(inPassword: string) {
        return this.validPasswordLength(inPassword) && this.validPasswordNumber(inPassword);
    }

    // Individual password validation checks
    static validPasswordLength(inPassword: string) {
        return inPassword.length >= 6; // At least 6 characters
    }

    static validPasswordSymbol(inPassword: string) {
        return /[`!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/.test(inPassword); // At least 1 symbol
    }

    static validPasswordNumber(inPassword: string) {
        return /[0-9]+/.test(inPassword); // At least one number
    }
}

// --------------- //
// - PERMISSIONS - //
// --------------- //

export class JC_Utils_Permissions {
    static async checkClipboardPermission(): Promise<boolean> {
        try {
            // Check if navigator is defined (client-side only)
            if (typeof navigator === "undefined" || typeof navigator.permissions === "undefined") {
                return false;
            }
            if (navigator.permissions) {
                const permissionStatus = await navigator.permissions.query({ name: "clipboard-read" as PermissionName });

                if (permissionStatus.state === "granted") {
                    return true;
                } else if (permissionStatus.state === "prompt") {
                    try {
                        await navigator.clipboard.readText();
                        JC_Utils.showToastInfo("Permission granted.\nPlease run function again.");
                        return false;
                    } catch (err) {
                        return false;
                    }
                } else {
                    JC_Utils.showToastError("Clipboard access is blocked. Please enable clipboard permission in your browser settings.");
                    return false;
                }
            } else {
                try {
                    await navigator.clipboard.readText();
                    return true;
                } catch (err) {
                    JC_Utils.showToastError("Clipboard access is not available in this browser.");
                    return false;
                }
            }
        } catch (error) {
            console.error("Error checking clipboard permission:", error);
            JC_Utils.showToastError("Failed to check clipboard permission.");
            return false;
        }
    }
}

// ------- //
// - CSS - //
// ------- //

export class JC_Utils_CSS {
    static forceHideHeaderFooter(styles: any) {
        document.getElementById("JC_header")?.classList.add(styles.forceHidden);
        document.getElementById("JC_footer")?.classList.add(styles.forceHidden);
    }

    static forceWhiteBackground(styles: any) {
        document.getElementById("rootMainContainer")?.classList.add(styles.forceWhiteBackground);
    }

    static forceRootOverflowYHidden(styles: any) {
        document.getElementById("rootMainContainer")?.classList.add(styles.forceOverflowYHidden);
    }
}

// --------- //
// - ROOMS - //
// --------- //

export class JC_Utils_Rooms {
    // Parse rooms JSON string into array
    static parseRoomsJson(roomsListJson?: string): string[] {
        if (!roomsListJson) return [];
        try {
            return JSON.parse(roomsListJson) || [];
        } catch (error) {
            console.error("Error parsing rooms JSON:", error);
            return [];
        }
    }

    // Get selected room names from rooms array
    static getSelectedRoomNames(rooms: string[], _selectedRooms: string[]): string[] {
        // For now, just return all rooms since we don't have selection logic
        return rooms;
    }
}

// ----------- //
// - DEFECTS - //
// ----------- //

export class JC_Utils_Defects {
    // Count DefectImages for a specific defect
    static countDefectImages(defectId: string, defectImages: any[]): number {
        return defectImages.filter(image => image.DefectId === defectId).length;
    }

    // Count DefectImages for a specific defect using Ex_ImageFileIds from the defect object
    static countDefectImagesFromDefect(defect: any): number {
        if (defect.Ex_ImageFileIds && Array.isArray(defect.Ex_ImageFileIds)) {
            return defect.Ex_ImageFileIds.length;
        }
        return 0;
    }

    // Get defects for a specific room
    static getDefectsForRoom(_roomName: string, allDefects: any[], _roomOptions: any[]): any[] {
        // For now, return all defects since we don't have room-specific filtering
        // In a real implementation, you might filter by room or area
        return allDefects;
    }
}

// ----------- //
// - PRICING - //
// ----------- //

export class JC_Utils_Pricing {
    /**
     * Calculate Sales Price from Cost Price and Percent Markup
     * @param costPrice The cost price
     * @param percentMarkup The percent markup
     * @returns The calculated sales price
     */
    static calculateSalesPrice(costPrice: number, percentMarkup: number): number {
        const result = costPrice * (1 + percentMarkup / 100);
        return parseFloat(result.toFixed(2));
    }

    /**
     * Calculate Percent Markup from Cost Price and Sales Price
     * @param costPrice The cost price
     * @param salesPrice The sales price
     * @returns The calculated percent markup
     */
    static calculatePercentMarkup(costPrice: number, salesPrice: number): number {
        if (costPrice === 0) return 0;
        const result = (salesPrice / costPrice - 1) * 100;
        return parseFloat(result.toFixed(2));
    }

    /**
     * Calculate Sales Price from Cost Price and Profit Margin
     * @param costPrice The cost price
     * @param profitMargin The profit margin percentage
     * @returns The calculated sales price
     */
    static calculateSalesPriceFromMargin(costPrice: number, profitMargin: number): number {
        // For profit margin: Sales Price = Cost Price / (1 - (Profit Margin / 100))
        if (profitMargin >= 100) return costPrice * 100; // Prevent division by zero or negative
        const result = costPrice / (1 - profitMargin / 100);
        return parseFloat(result.toFixed(2));
    }

    /**
     * Calculate Profit Margin from Cost Price and Sales Price
     * @param costPrice The cost price
     * @param salesPrice The sales price
     * @returns The calculated profit margin percentage
     */
    static calculateProfitMargin(costPrice: number, salesPrice: number): number {
        if (costPrice === 0 || salesPrice === 0) return 0;
        // For profit margin: ((Sales Price - Cost Price) / Sales Price) * 100
        const result = ((salesPrice - costPrice) / salesPrice) * 100;
        return parseFloat(result.toFixed(2));
    }
}
