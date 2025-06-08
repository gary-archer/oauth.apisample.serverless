import {APIGatewayProxyEvent} from 'aws-lambda';
import {Container} from 'inversify';

/*
 * The extended event stores the child container per request
 */
export interface APIGatewayProxyExtendedEvent extends APIGatewayProxyEvent {
    container: Container,
}
