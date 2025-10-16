export class _Base {
    CreatedAt: Date;
    ModifiedAt?: Date;
    Deleted: boolean;

    constructor(init?: Partial<_Base>) {
        this.CreatedAt = new Date();
        this.ModifiedAt = undefined;
        this.Deleted = false;
        Object.assign(this, init);
    }
}
