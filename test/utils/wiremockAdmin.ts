import axios, {AxiosRequestConfig} from 'axios';
import {Guid} from 'guid-typescript';
import {HttpProxy} from '../../src/plumbing/utilities/httpProxy.js';

/*
 * Manage updates to Wiremock
 */
export class WiremockAdmin {

    private readonly _baseUrl: string;
    private readonly _jsonWebKeysId: string;
    private readonly _userInfoId: string;
    private readonly _httpProxy: HttpProxy;

    public constructor(useProxy: boolean) {
        this._baseUrl = 'http://login.authsamples-dev.com/__admin/mappings';
        this._jsonWebKeysId = Guid.create().toString();
        this._userInfoId = Guid.create().toString();
        this._httpProxy = new HttpProxy(useProxy, 'http://127.0.0.1:8888');
    }

    /*
     * Ensure that we can view messages sent to Wiremock Admin API, when configured
     */
    public async initialize(): Promise<void> {
        this._httpProxy.initialize();
    }

    /*
     * Register our test JWKS values at the start of the test suite
     */
    public async registerJsonWebWeys(keysJson: string): Promise<void> {

        const stubbedResponse = {
            id: this._jsonWebKeysId,
            priority: 1,
            request: {
                method: 'GET',
                url: '/.well-known/jwks.json'
            },
            response: {
                status: 200,
                body: keysJson,
            },
        };

        return this._register(stubbedResponse);
    }

    /*
     * Unregister our test JWKS values at the end of the test suite
     */
    public async unregisterJsonWebWeys(): Promise<void> {
        return this._unregister(this._jsonWebKeysId);
    }

    /*
     * Register a user at the start of an individual test
     */
    public async registerUserInfo(userJson: string): Promise<void> {

        const stubbedResponse = {
            id: this._userInfoId,
            priority: 1,
            request: {
                method: 'POST',
                url: '/oauth2/userInfo'
            },
            response: {
                status: 200,
                body: userJson,
            },
        };

        return this._register(stubbedResponse);
    }

    /*
     * Unregister a user at the end of an individual test
     */
    public async unregisterUserInfo(): Promise<void> {
        return this._unregister(this._userInfoId);
    }

    /*
     * Add a stubbed response to Wiremock via its Admin API
     */
    private async _register(stubbedResponse: any): Promise<void> {

        const options = {
            url: this._baseUrl,
            method: 'POST',
            data: stubbedResponse,
            headers: {
                'content-type': 'application/json',
            },
            httpAgent: this._httpProxy.agent,
        } as AxiosRequestConfig;

        const response = await axios(options);
        if (response.status !== 201) {
            throw new Error(`Failed to add Wiremock stub: status ${response.status}`);
        }
    }

    /*
     * Delete a stubbed response to Wiremock via its Admin API
     */
    private async _unregister(id: string): Promise<void> {

        const options = {
            url: `${this._baseUrl}/${id}`,
            method: 'DELETE',
            httpAgent: this._httpProxy.agent,
        } as AxiosRequestConfig;

        const response = await axios(options);
        if (response.status !== 200) {
            throw new Error(`Failed to delete Wiremock stub: status ${response.status}`);
        }
    }
}
