import { JC_Utils } from "../Utils";
import { _ModelConstructor } from "../models/_ModelRequirements";

export async function JC_Put<T>(mapper: _ModelConstructor<T>, routeName: string, newRecord: T, params?: any) {
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

    // Clear cache for this table after successful create operation
    // Create a model instance to access ExtendedFields for clearing referenced model caches
    const modelInstance = new mapper();
    JC_Utils.clearLocalStorageForTable(mapper.tableName, modelInstance);

    return new mapper(result.result);
}
