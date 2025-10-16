import { _ModelRequirements } from "../_ModelRequirements";

export interface JC_ToggleButtonsModel<T extends _ModelRequirements = _ModelRequirements> {
    overrideClass?: string;
    options: T[];
    selectedId?: string;
    onChange?: (selectedId: string) => void;
}
