import {Container} from 'inversify';
import 'reflect-metadata';
import {SAMPLETYPES} from '../../logic/dependencies/sampleTypes';
import {CompanyService} from '../../logic/services/companyService';
import {ResponseWriter} from '../../plumbing-base';
import {LambdaConfiguration} from './startup/lambdaConfiguration';

/*
 * The entry point is similar to a REST controller
 */
const container = new Container();
const baseHandler = async () => {

    // Resolve the service and execute the logic
    const service = container.get<CompanyService>(SAMPLETYPES.CompanyService);
    const companies = await service.getCompanyList();

    // Write the response
    return ResponseWriter.objectResponse(200, companies);
};

// Create an enriched handler, which wires up middleware to run before the above handler
const configuration = new LambdaConfiguration(container);
const handler = configuration.enrichHandler(baseHandler);

// Export the handler to serverless.yml
export {handler};
