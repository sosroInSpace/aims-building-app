import { JC_Utils } from "../Utils";

export async function JC_PutRaw<T>(routeName: string, newRecord: T, params?: any, tableName?: string): Promise<T> {
    const response = await fetch(`/api/${routeName}${params != null ? `?${new URLSearchParams(params)}` : ""}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRecord)
    });
    if (!response.ok) {
        let responseJson = await response.json();
        throw new Error(!JC_Utils.stringNullOrEmpty(responseJson.error) ? responseJson.error : `Failed to create ${JC_Utils.routeNameToDescription(routeName)}.`);
    }
    const result = await response.json();

    // Clear cache for the specified table after successful create operation
    if (tableName) {
        JC_Utils.clearLocalStorageForTable(tableName);
    }

    // Return result.result if it exists, otherwise return the result directly
    return result.result !== undefined ? result.result : result;
}
