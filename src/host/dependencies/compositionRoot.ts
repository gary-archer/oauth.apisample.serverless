import {Container} from 'inversify';
import {SAMPLETYPES} from '../../logic/dependencies/sampleTypes.js';
import {CompanyRepository} from '../../logic/repositories/companyRepository.js';
import {UserRepository} from '../../logic/repositories/userRepository.js';
import {CompanyService} from '../../logic/services/companyService.js';
import {JsonFileReader} from '../../logic/utilities/jsonFileReader.js';

/*
 * Compose the application's business dependencies
 */
export class CompositionRoot {

    /*
     * Register this API's dependencies, most of which will be recreated for each API request
     * Note also that Inversify instantiates each per request object at application startup to create a dependency graph
     */
    public static register(container: Container): void {

        // Business logic classes use a non REST based transient scope
        container.bind<CompanyService>(SAMPLETYPES.CompanyService).to(CompanyService).inTransientScope();
        container.bind<CompanyRepository>(SAMPLETYPES.CompanyRepository).to(CompanyRepository).inTransientScope();
        container.bind<UserRepository>(SAMPLETYPES.UserRepository).to(UserRepository).inTransientScope();
        container.bind<JsonFileReader>(SAMPLETYPES.JsonFileReader).to(JsonFileReader).inTransientScope();
    }
}
