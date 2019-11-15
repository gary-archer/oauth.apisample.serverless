import {Context} from 'aws-lambda';
import {Container} from 'inversify';
import 'reflect-metadata';
import {OAUTHPUBLICTYPES, PolicyDocument} from '../../framework-api-oauth';
import {HandlerFactory} from './handlerFactory';

// Create the container
const container = new Container();

/*
 * Our handler just returns the AWS policy document produced by framework middleware
 */
const baseHandler = async (event: any, context: Context) => {

    const document = container.get<PolicyDocument>(OAUTHPUBLICTYPES.PolicyDocument);
    return document.data;
};

// Create an enriched handler, which wires up OAuth handling to run before the above handler
const factory = new HandlerFactory(container);
const handler = factory.enrichHandler(baseHandler);

// Export the handler to serverless.yml
export {handler};
