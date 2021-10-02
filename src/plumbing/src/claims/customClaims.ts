import {injectable} from 'inversify';

/*
 * A default implementation of custom claims
 */
@injectable()
export class CustomClaims {

    /* eslint-disable @typescript-eslint/no-unused-vars */
    public static importData(data: any): CustomClaims {
        return new CustomClaims();
    }

    public exportData(): any {
        return {};
    }
}
