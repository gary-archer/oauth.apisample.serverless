import {Request} from 'express';
import {CoreApiClaims} from '../../../framework-api-base';

/*
 * An interface for providing custom claims that the business logic can implement
 */
export interface CustomClaimsProvider<TClaims extends CoreApiClaims> {

    addCustomClaims(accessToken: string, request: Request, claims: TClaims): Promise<void>;
}
