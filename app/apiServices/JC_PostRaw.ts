import { JC_Utils } from "../Utils";

export async function JC_PostRaw<TInput, TOutput = TInput>(routeName: string, body: TInput, params?: any, tableName?: string): Promise<TOutput> {
    const response = await fetch(`/api/${routeName}${params != null ? `?${new URLSearchParams(params)}` : ""}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });
    if (!response.ok) {
        throw new Error(`Failed to update ${JC_Utils.routeNameToDescription(routeName)}.`);
    }
    const result = await response.json();

    // Clear cache for the specified table after successful update operation
    if (tableName) {
        JC_Utils.clearLocalStorageForTable(tableName);
    }

    // Return result.result if it exists, otherwise return the result directly
    return result.result !== undefined ? result.result : result;
}
