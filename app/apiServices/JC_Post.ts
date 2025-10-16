import { JC_Utils } from "../Utils";
import { _ModelConstructor } from "../models/_ModelRequirements";

export async function JC_Post<T>(mapper: _ModelConstructor<T>, routeName: string, body: T, params?: any) {
    const response = await fetch(`/api/${routeName}${params != null ? `?${new URLSearchParams(params)}` : ""}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });
    if (!response.ok) {
        throw new Error(`Failed to update ${JC_Utils.routeNameToDescription(routeName)}.`);
    }
    const result = await response.json();

    // Clear cache for this table after successful update operation
    // Create a model instance to access ExtendedFields for clearing referenced model caches
    const modelInstance = new mapper();
    JC_Utils.clearLocalStorageForTable(mapper.tableName, modelInstance);

    return new mapper(result.result);
}
