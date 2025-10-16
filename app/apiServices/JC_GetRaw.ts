import { JC_Utils } from "../Utils";

export async function JC_GetRaw<T>(routeName: string, params: any): Promise<T> {
    const response = await fetch(`/api/${routeName}?${new URLSearchParams(params)}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch ${JC_Utils.routeNameToDescription(routeName)}.`);
    }
    const result = await response.json();
    return result.result;
}
