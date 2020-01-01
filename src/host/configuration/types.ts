/*
 * Business logic types used with dependency injection
 */
export const TYPES = {
    JsonFileReader: Symbol.for('JsonFileReader'),
    CompanyRepository: Symbol.for('CompanyRepository'),
    CompanyService: Symbol.for('CompanyService'),
};
