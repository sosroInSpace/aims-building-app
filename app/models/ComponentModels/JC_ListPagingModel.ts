export interface JC_ListSortModel {
    SortField?: string;
    SortAsc?: boolean;
    nullsFirst?: boolean;
}

export interface JC_ListPagingModel {
    PageSize?: number;
    PageIndex?: number;
    Sorts?: JC_ListSortModel[];
    SearchText?: string;
    SearchFields?: string[];
}

export interface JC_ListPagingResultModel<T> {
    ResultList: T[];
    TotalCount: number;
    TotalPages: number;
}
