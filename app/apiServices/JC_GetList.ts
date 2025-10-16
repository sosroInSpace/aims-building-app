import { JC_Utils } from "../Utils";
import { JC_ListPagingModel, JC_ListPagingResultModel } from "../models/ComponentModels/JC_ListPagingModel";
import { _ModelConstructor } from "../models/_ModelRequirements";

export async function JC_GetList<T>(mapper: _ModelConstructor<T>, routeName: string, paging?: JC_ListPagingModel, params?: any, abortSignal?: AbortSignal): Promise<JC_ListPagingResultModel<T>> {
    // Only use caching if model explicitly provides cache minutes
    let storageKey: string | null = null;
    let cacheMinutes: number | undefined = undefined;

    if (mapper.cacheMinutes_getList !== undefined) {
        // Create a consistent cache key based on tableName, routeName, params, and paging
        let keyParams = "";
        if (params) {
            // If params has the primary key value, use that; otherwise stringify the whole params object
            if (params[mapper.primaryKey]) {
                keyParams = `_${params[mapper.primaryKey]}`;
            } else {
                keyParams = `_${JSON.stringify(params)}`;
            }
        }

        let keyPaging = "";
        if (paging) {
            keyPaging = `_${JSON.stringify(paging)}`;
        }

        storageKey = `${mapper.tableName}_${routeName}${keyParams}${keyPaging}`;
        cacheMinutes = mapper.cacheMinutes_getList;
    }

    let cachedResults: string | null = null;
    let nextResetTime: Date | null = null;

    if (storageKey && cacheMinutes !== undefined) {
        cachedResults = JC_Utils.safeLocalStorageGetItem(storageKey);
        const resetTimeStr = JC_Utils.safeLocalStorageGetItem(`${storageKey}_ResetTime`);
        nextResetTime = resetTimeStr ? new Date(resetTimeStr) : null;
    }

    // IF caching is disabled OR not saved in localStorage yet OR it has been past nextResetTime, get list from backend
    if (!storageKey || !cachedResults || !nextResetTime || new Date() > nextResetTime) {
        // Check if we're in demo mode
        const isDemoMode = window.location.pathname.includes("/demo/");

        // Merge paging parameters with existing params
        let allParams = { ...params };

        if (paging) {
            allParams.PageSize = paging.PageSize?.toString();
            allParams.PageIndex = paging.PageIndex?.toString();

            // Send all sorts to backend
            if (paging.Sorts && paging.Sorts.length > 0) {
                // For backward compatibility, use the first sort if available
                allParams.SortField = paging.Sorts[0].SortField;
                allParams.SortAsc = paging.Sorts[0].SortAsc;

                // Send all sorts as JSON string for backend processing
                allParams.Sorts = JSON.stringify(paging.Sorts);
            }

            allParams.SearchText = paging.SearchText;
            allParams.SearchFields = paging.SearchFields;
        }

        // Add isDemoMode parameter for ProductGroup and Ingredient routes
        if (routeName === "productGroup" || routeName === "ingredient") {
            allParams.isDemoMode = isDemoMode;
        }

        const response = await fetch(`/api/${routeName}?${new URLSearchParams(allParams)}`, {
            signal: abortSignal
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch ${JC_Utils.routeNameToDescription(routeName)}.`);
        }
        const responseData = await response.json();

        // Handle both old format (direct array) and new format (JC_ListPagingResultModel)
        let result: JC_ListPagingResultModel<T>;
        if (responseData.result && Array.isArray(responseData.result)) {
            // Old format - direct array, convert to new format
            const resultList = responseData.result.map((o: any) => new mapper(o));
            result = {
                ResultList: resultList,
                TotalCount: 0,
                TotalPages: 0
            };
        } else if (responseData.result && responseData.result.ResultList) {
            // New format - JC_ListPagingResultModel
            result = {
                ResultList: responseData.result.ResultList.map((o: any) => new mapper(o)),
                TotalCount: responseData.result.TotalCount || 0,
                TotalPages: responseData.result.TotalPages || 0
            };
        } else {
            result = {
                ResultList: [],
                TotalCount: 0,
                TotalPages: 0
            };
        }

        // Cache the result if we have a storage key and cache minutes
        if (storageKey && cacheMinutes !== undefined) {
            JC_Utils.safeLocalStorageSetItem(storageKey, JSON.stringify(result.ResultList));
            JC_Utils.safeLocalStorageSetItem(`${storageKey}_ResetTime`, new Date(new Date().getTime() + 60000 * cacheMinutes).toString());
        }
        return result;
    }
    // ELSE return from localStorage
    else {
        console.log(`Retrieved ${mapper.tableName} getList from cache`);
        const resultList = (JSON.parse(cachedResults) as T[]).map(o => new mapper(o));
        return {
            ResultList: resultList,
            TotalCount: 0,
            TotalPages: 0
        };
    }
}
