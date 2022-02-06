/*
 * Business logic types used with dependency injection
 */
export const SAMPLETYPES = {
    JsonFileReader: Symbol.for('JsonFileReader'),
    CompanyRepository: Symbol.for('CompanyRepository'),
    CompanyService: Symbol.for('CompanyService'),
};
