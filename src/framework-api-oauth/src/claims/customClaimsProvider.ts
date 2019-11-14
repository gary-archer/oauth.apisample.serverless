import {ApiClaims} from '../../../framework-api-base';

/*
 * An interface for providing custom claims that the business logic can implement
 */
export interface CustomClaimsProvider<TClaims extends ApiClaims> {

    addCustomClaims(accessToken: string, claims: TClaims): Promise<void>;
}
