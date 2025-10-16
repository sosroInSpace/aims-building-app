import { JC_Utils } from "../Utils";
import { JC_Delete } from "../apiServices/JC_Delete";
import { JC_Get } from "../apiServices/JC_Get";
import { JC_GetList } from "../apiServices/JC_GetList";
import { JC_GetRaw } from "../apiServices/JC_GetRaw";
import { JC_Post } from "../apiServices/JC_Post";
import { JC_PostRaw } from "../apiServices/JC_PostRaw";
import { JC_Put } from "../apiServices/JC_Put";
import { JC_PutRaw } from "../apiServices/JC_PutRaw";
import { FieldTypeEnum } from "../enums/FieldType";
import { JC_ListPagingModel } from "./ComponentModels/JC_ListPagingModel";
import { O_ReportTypeModel } from "./O_ReportType";
import { _Base } from "./_Base";
import { _ExtendedField } from "./_ExtendedField";
import { _ModelRequirements } from "./_ModelRequirements";

export class UserModel extends _Base implements _ModelRequirements {
    static tableName: string = "User";
    static apiRoute: string = "user";
    static primaryKey: string = "Id";
    static primaryDisplayField: string = "FirstName";

    // - -------- - //
    // - SERVICES - //
    // - -------- - //
    static apiRoute_getByToken: string = "user/getByToken";
    static async Get(id: string) {
        return await JC_Get<UserModel>(UserModel, UserModel.apiRoute, { id });
    }
    static async ItemExists(id: string) {
        const exists = await JC_GetRaw<boolean>(`${UserModel.apiRoute}/itemExists`, { id });
        return { exists };
    }
    static async GetList(paging?: JC_ListPagingModel, abortSignal?: AbortSignal) {
        return await JC_GetList<UserModel>(UserModel, `${UserModel.apiRoute}/getList`, paging, {}, abortSignal);
    }
    static async GetAdminUsers(paging?: JC_ListPagingModel, abortSignal?: AbortSignal) {
        return await JC_GetList<UserModel>(UserModel, `${UserModel.apiRoute}/getAdminUsers`, paging, {}, abortSignal);
    }
    static async GetEmployeeUsersForAdmin(paging?: JC_ListPagingModel, abortSignal?: AbortSignal) {
        return await JC_GetList<UserModel>(UserModel, `${UserModel.apiRoute}/getEmployeeUsersForAdmin`, paging, {}, abortSignal);
    }
    static async Create(data: UserModel) {
        return await JC_Put<UserModel>(UserModel, UserModel.apiRoute, data);
    }
    static async CreateList(dataList: UserModel[]) {
        return await JC_PutRaw<UserModel[]>(`${UserModel.apiRoute}/createList`, dataList, undefined, "User");
    }
    static async Update(data: UserModel) {
        return await JC_Post<UserModel>(UserModel, UserModel.apiRoute, data);
    }
    static async UpdateList(dataList: UserModel[]) {
        return await JC_PostRaw<UserModel[]>(`${UserModel.apiRoute}/updateList`, dataList, undefined, "User");
    }
    static async Delete(id: string) {
        return await JC_Delete(UserModel, UserModel.apiRoute, id);
    }
    static async DeleteList(ids: string[]) {
        return await JC_PostRaw(`${UserModel.apiRoute}/deleteList`, { ids }, undefined, "User");
    }

    // - --------- - //
    // - VARIABLES - //
    // - --------- - //

    Id: string;
    FirstName: string;
    LastName: string;
    Email: string;
    PasswordHash: string;
    LoginFailedAttempts: number;
    LoginLockoutDate?: Date;
    ChangePasswordToken?: string;
    ChangePasswordTokenDate?: Date;
    Phone?: string;
    EmployeeOfUserId?: string;
    CompanyName?: string;
    ABN?: string;
    Qualification?: string;
    IsEmailSubscribed: boolean;
    IsDiscountUser: boolean;
    StripeCustomerId?: string;
    LogoFileId?: string;
    IsVerified: boolean;
    VerificationToken?: string;
    Enable2fa: boolean;
    TwoFactorCode?: string;
    TwoFactorCodeExpiry?: Date;
    ReportTypeListJson?: string;

    // Extended Fields
    Ex_EmployeeOfUserName?: string;
    Ex_ReportTypeCodesList?: string[];
    Ex_ReportTypeList?: O_ReportTypeModel[];

    // Extended Fields (required by _ModelRequirements interface)
    ExtendedFields: _ExtendedField[] = [
        { Name: "Ex_EmployeeOfUserName", FromField: "EmployeeOfUserId", ReferenceModel: UserModel },
        {
            Name: "Ex_ReportTypeCodesList",
            FromField: "ReportTypeListJson",
            ReferenceModel: O_ReportTypeModel,
            setWithCallback: (instance: UserModel) => {
                if (instance.ReportTypeListJson) {
                    try {
                        return JSON.parse(instance.ReportTypeListJson);
                    } catch {
                        return [];
                    }
                } else {
                    return [];
                }
            }
        },
        {
            Name: "Ex_ReportTypeList",
            FromField: "ReportTypeListJson",
            ReferenceModel: O_ReportTypeModel,
            setWithCallback: async (instance: UserModel) => {
                // First ensure Ex_ReportTypeCodesList is populated from ReportTypeListJson
                let codesList: string[] = [];
                if (instance.ReportTypeListJson) {
                    try {
                        codesList = JSON.parse(instance.ReportTypeListJson);
                    } catch {
                        codesList = [];
                    }
                } else {
                    codesList = [];
                }

                // Set Ex_ReportTypeCodesList if not already set
                if (!instance.Ex_ReportTypeCodesList) {
                    instance.Ex_ReportTypeCodesList = codesList;
                }

                if (!codesList || codesList.length === 0) {
                    return [];
                }
                try {
                    const allOptions = await O_ReportTypeModel.GetList();
                    return allOptions.ResultList.filter(option => codesList.includes(option.Code));
                } catch (error) {
                    console.error("Error fetching ReportType options:", error);
                    return [];
                }
            }
        }
    ];

    // - ----------- - //
    // - CONSTRUCTOR - //
    // - ----------- - //

    constructor(init?: Partial<UserModel>) {
        super(init);
        this.Id = JC_Utils.generateGuid();
        this.FirstName = "";
        this.LastName = "";
        this.Email = "";
        this.PasswordHash = "";
        this.LoginFailedAttempts = 0;
        this.LoginLockoutDate = undefined;
        this.ChangePasswordToken = undefined;
        this.ChangePasswordTokenDate = undefined;
        this.Phone = undefined;
        this.EmployeeOfUserId = undefined;
        this.CompanyName = undefined;
        this.ABN = undefined;
        this.Qualification = undefined;
        this.IsEmailSubscribed = true;
        this.IsDiscountUser = false;
        this.StripeCustomerId = undefined;
        this.LogoFileId = undefined;
        this.IsVerified = false;
        this.VerificationToken = undefined;
        this.Enable2fa = false;
        this.TwoFactorCode = undefined;
        this.TwoFactorCodeExpiry = undefined;
        this.ReportTypeListJson = undefined;
        this.Ex_EmployeeOfUserName = undefined;
        this.Ex_ReportTypeCodesList = undefined;
        this.Ex_ReportTypeList = undefined;
        Object.assign(this, init);
    }

    static getKeys() {
        return Object.keys(new UserModel());
    }

    static jcFieldTypeforField(fieldName: keyof UserModel) {
        switch (fieldName) {
            case "Id":
                return FieldTypeEnum.Text;
            case "FirstName":
                return FieldTypeEnum.Text;
            case "LastName":
                return FieldTypeEnum.Text;
            case "Email":
                return FieldTypeEnum.Email;
            case "PasswordHash":
                return FieldTypeEnum.Password;
            case "LoginFailedAttempts":
                return FieldTypeEnum.Number;
            case "LoginLockoutDate":
                return FieldTypeEnum.Date;
            case "ChangePasswordToken":
                return FieldTypeEnum.Text;
            case "ChangePasswordTokenDate":
                return FieldTypeEnum.Date;
            case "Phone":
                return FieldTypeEnum.Text;
            case "EmployeeOfUserId":
                return FieldTypeEnum.Dropdown;
            case "CompanyName":
                return FieldTypeEnum.Text;
            case "ABN":
                return FieldTypeEnum.Text;
            case "Qualification":
                return FieldTypeEnum.Text;
            case "IsEmailSubscribed":
                return FieldTypeEnum.Dropdown;
            case "IsDiscountUser":
                return FieldTypeEnum.Dropdown;
            case "StripeCustomerId":
                return FieldTypeEnum.Text;
            case "LogoFileId":
                return FieldTypeEnum.Photo;
            case "IsVerified":
                return FieldTypeEnum.Dropdown;
            case "VerificationToken":
                return FieldTypeEnum.Text;
            case "Enable2fa":
                return FieldTypeEnum.Dropdown;
            case "TwoFactorCode":
                return FieldTypeEnum.Text;
            case "TwoFactorCodeExpiry":
                return FieldTypeEnum.Date;
            case "ReportTypeListJson":
                return FieldTypeEnum.MultiDropdown;
            default:
                return FieldTypeEnum.Text;
        }
    }

    // - ------ - //
    // - STRING - //
    // - ------ - //

    toString() {
        return `${this.FirstName} ${this.LastName} | ${this.Email}`;
    }
}
