import { JC_Utils } from "../Utils";
import { _ModelConstructor } from "../models/_ModelRequirements";

export async function JC_Delete<T>(mapper: _ModelConstructor<T>, routeName: string, id: string): Promise<boolean> {
    // Always use lowercase parameter names for API calls, regardless of model primaryKey casing
    const modelPrimaryKey = (mapper as any).primaryKey || "id";
    const parameterName = modelPrimaryKey.toLowerCase();
    const params = new URLSearchParams();
    params.set(parameterName, id);

    const response = await fetch(`/api/${routeName}?${params.toString()}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" }
    });
    if (!response.ok) {
        throw new Error(`Failed to delete ${JC_Utils.routeNameToDescription(routeName)} with ${parameterName} "${id}".`);
    }

    // Clear cache for this table after successful delete operation
    // Create a model instance to access ExtendedFields for clearing referenced model caches
    const modelInstance = new mapper();
    JC_Utils.clearLocalStorageForTable(mapper.tableName, modelInstance);

    return true;
}
