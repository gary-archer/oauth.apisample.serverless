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
     * Register this API's dependencies
     */
    public static register(parentContainer: Container): void {

        parentContainer.bind<CompanyService>(SAMPLETYPES.CompanyService).to(CompanyService).inTransientScope();
        parentContainer.bind<CompanyRepository>(SAMPLETYPES.CompanyRepository).to(CompanyRepository).inTransientScope();
        parentContainer.bind<UserRepository>(SAMPLETYPES.UserRepository).to(UserRepository).inTransientScope();
        parentContainer.bind<JsonFileReader>(SAMPLETYPES.JsonFileReader).to(JsonFileReader).inTransientScope();
    }
}
