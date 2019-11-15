/*
 * A wrapper for the policy document
 */
export class PolicyDocument {

    private readonly _data: any;

    public constructor(data: any) {
        this._data = data;
    }

    public get data(): any {
        return this._data;
    }
}
