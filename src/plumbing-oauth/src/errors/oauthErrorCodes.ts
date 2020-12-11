/*
 * A list of known OAuth related error codes
 */
export class OAuthErrorCodes {

    public static readonly metadataLookupFailure = 'metadata_lookup_failure';

    public static readonly signingKeyDownloadFailure = 'signing_key_download';

    public static readonly userinfoFailure = 'userinfo_failure';

    public static readonly userInfoTokenExpired = 'invalid_token';
}
