/*
 * Business logic types used with dependency injection
 */
export const LOGICTYPES = {
    CompanyService: Symbol.for('CompanyService'),
    CompanyRepository: Symbol.for('CompanyRepository'),
    JsonFileReader: Symbol.for('JsonFileReader'),
};
