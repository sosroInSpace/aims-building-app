export interface JC_ConfirmationModalUsageModel {
    width?: string;
    title: string;
    text: string;
    submitButtons: { text: string; onSubmit: () => void }[];
}
