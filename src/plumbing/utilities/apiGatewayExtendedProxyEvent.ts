import {APIGatewayProxyEvent} from 'aws-lambda';
import {Container} from 'inversify';

export interface APIGatewayProxyExtendedEvent extends APIGatewayProxyEvent {
    container: Container,
}
