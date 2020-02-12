import {Context, CustomAuthorizerResult} from 'aws-lambda';
import 'reflect-metadata';
import {ContainerHelper} from '../../framework-api-base';
import {OAUTHPUBLICTYPES} from '../../framework-api-oauth';
import {HandlerFactory} from './handlerFactory';

/*
 * Our handler just returns the AWS policy document produced by framework middleware
 */
const baseHandler = async (event: any, context: Context) => {

    const container = ContainerHelper.current(event);
    return container.get<CustomAuthorizerResult>(OAUTHPUBLICTYPES.AuthorizerResult);
};

// Create an enriched handler, which wires up OAuth handling to run before the above handler
const factory = new HandlerFactory();
const handler = factory.enrichHandler(baseHandler);

// Export the handler to serverless.yml
export {handler};
