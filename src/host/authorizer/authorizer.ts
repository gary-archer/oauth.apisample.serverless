import {Context, CustomAuthorizerResult} from 'aws-lambda';
import {Container} from 'inversify';
import 'reflect-metadata';
import {OAUTHPUBLICTYPES} from '../../plumbing-oauth';
import {HandlerFactory} from './handlerFactory';

const container = new Container();

/*
 * Our handler just returns the AWS policy document produced by framework middleware
 */
const baseHandler = async (event: any, context: Context) => {
    return container.get<CustomAuthorizerResult>(OAUTHPUBLICTYPES.AuthorizerResult);
};

// Create an enriched handler, which wires up OAuth handling to run before the above handler
const factory = new HandlerFactory(container);
const handler = factory.enrichHandler(baseHandler);

// Export the handler to serverless.yml
export {handler};
