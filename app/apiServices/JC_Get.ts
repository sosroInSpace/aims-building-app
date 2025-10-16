import { JC_Utils } from "../Utils";
import { _ModelConstructor } from "../models/_ModelRequirements";

export async function JC_Get<T>(mapper: _ModelConstructor<T>, routeName: string, params: any): Promise<T> {
    // Only use caching if model explicitly provides cache minutes
    let storageKey: string | null = null;
    let cacheMinutes: number | undefined = undefined;

    if (mapper.cacheMinutes_get !== undefined) {
        // Create a consistent cache key based on tableName and params
        let keyParams = "";
        if (params) {
            // If params has the primary key value, use that; otherwise stringify the whole params object
            if (params[mapper.primaryKey]) {
                keyParams = `_${params[mapper.primaryKey]}`;
            } else {
                keyParams = `_${JSON.stringify(params)}`;
            }
        }
        storageKey = `${mapper.tableName}_${routeName}${keyParams}`;
        cacheMinutes = mapper.cacheMinutes_get;
    }

    let cachedResult: string | null = null;
    let nextResetTime: Date | null = null;

    if (storageKey && cacheMinutes !== undefined) {
        cachedResult = JC_Utils.safeLocalStorageGetItem(storageKey);
        const resetTimeStr = JC_Utils.safeLocalStorageGetItem(`${storageKey}_ResetTime`);
        nextResetTime = resetTimeStr ? new Date(resetTimeStr) : null;
    }

    // IF caching is disabled OR not saved in localStorage yet OR it has been past nextResetTime, get from backend
    if (!storageKey || !cachedResult || !nextResetTime || new Date() > nextResetTime) {
        const response = await fetch(`/api/${routeName}?${new URLSearchParams(params)}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${JC_Utils.routeNameToDescription(routeName)}.`);
        }
        let result = (await response.json()).result;

        // Cache the result if we have a storage key and cache minutes
        if (storageKey && cacheMinutes !== undefined) {
            JC_Utils.safeLocalStorageSetItem(storageKey, JSON.stringify(result));
            JC_Utils.safeLocalStorageSetItem(`${storageKey}_ResetTime`, new Date(new Date().getTime() + 60000 * cacheMinutes).toString());
        }

        return new mapper(result);
    }
    // ELSE return from localStorage
    else {
        console.log(`Retrieved ${mapper.tableName} get from cache`);
        const result = JSON.parse(cachedResult);
        return new mapper(result);
    }
}
