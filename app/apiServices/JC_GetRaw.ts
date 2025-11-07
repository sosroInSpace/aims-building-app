import { JC_Utils } from "../Utils";

export async function JC_GetRaw<T>(routeName: string, params: any): Promise<T> {
    const response = await fetch(`/api/${routeName}?${new URLSearchParams(params)}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch ${JC_Utils.routeNameToDescription(routeName)}.`);
    }
    const result = await response.json();
    return result.result;
}

// Cached version of JC_GetRaw
export async function JC_GetRawCached<T>(routeName: string, params: any, cacheKey: string, cacheMinutes: number): Promise<T> {
    let cachedResult: string | null = null;
    let nextResetTime: Date | null = null;

    // Check cache
    cachedResult = JC_Utils.safeLocalStorageGetItem(cacheKey);
    const resetTimeStr = JC_Utils.safeLocalStorageGetItem(`${cacheKey}_ResetTime`);
    nextResetTime = resetTimeStr ? new Date(resetTimeStr) : null;

    // IF not saved in localStorage yet OR it has been past nextResetTime, get from backend
    if (!cachedResult || !nextResetTime || new Date() > nextResetTime) {
        const response = await fetch(`/api/${routeName}?${new URLSearchParams(params)}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${JC_Utils.routeNameToDescription(routeName)}.`);
        }
        let result = await response.json();

        // Cache the result
        JC_Utils.safeLocalStorageSetItem(cacheKey, JSON.stringify(result));
        JC_Utils.safeLocalStorageSetItem(`${cacheKey}_ResetTime`, new Date(new Date().getTime() + 60000 * cacheMinutes).toString());

        return result;
    }
    // ELSE return from localStorage
    else {
        console.log(`Retrieved ${cacheKey} from cache`);
        return JSON.parse(cachedResult);
    }
}
