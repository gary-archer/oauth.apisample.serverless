/*
 * Business logic types used with dependency injection
 */
export const SAMPLETYPES = {
    CompanyRepository: Symbol.for('CompanyRepository'),
    CompanyService: Symbol.for('CompanyService'),
    JsonFileReader: Symbol.for('JsonFileReader'),
    UserRepository: Symbol.for('UserRepository'),
};
