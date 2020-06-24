import {Context, CustomAuthorizerResult} from 'aws-lambda';
import {Container} from 'inversify';
import 'reflect-metadata';
import {OAUTHTYPES} from '../../plumbing-oauth';
import {AuthorizerConfiguration} from './startup/authorizerConfiguration';

/*
 * Our handler just returns the AWS policy document produced by OAuth middleware
 */
const container = new Container();
const baseHandler = async (event: any, context: Context) => {
    return container.get<CustomAuthorizerResult>(OAUTHTYPES.AuthorizerResult);
};

// Create an enriched handler, which wires up OAuth handling to run before the above handler
const config = new AuthorizerConfiguration(container);
const handler = config.enrichHandler(baseHandler);

// Export the handler to serverless.yml
export {handler};
