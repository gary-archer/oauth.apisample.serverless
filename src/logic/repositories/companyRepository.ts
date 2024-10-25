import {inject, injectable} from 'inversify';
import {BASETYPES} from '../../plumbing/dependencies/baseTypes.js';
import {LogEntry} from '../../plumbing/logging/logEntry.js';
import {using} from '../../plumbing/utilities/using.js';
import {SAMPLETYPES} from '../dependencies/sampleTypes.js';
import {Company} from '../entities/company.js';
import {CompanyTransactions} from '../entities/companyTransactions.js';
import {JsonFileReader} from '../utilities/jsonFileReader.js';

/*
 * A repository for getting data about companies
 */
@injectable()
export class CompanyRepository {

    // An injected object to read data from text files
    private readonly jsonReader: JsonFileReader;

    // Every API request receives its log entry and can contribute to it
    private readonly logEntry: LogEntry;

    public constructor(
        @inject(SAMPLETYPES.JsonFileReader) jsonReader: JsonFileReader,
        @inject(BASETYPES.LogEntry) logEntry: LogEntry) {

        this.jsonReader = jsonReader;
        this.logEntry = logEntry;
        this.setupCallbacks();
    }

    /*
     * Return the list of companies from a hard coded data file
     */
    public async getCompanyList(): Promise<Company[]> {

        return using(this.logEntry.createPerformanceBreakdown('selectCompanyListData'), async () => {

            return this.jsonReader.readData<Company[]>('data/companyList.json');
        });
    }

    /*
     * Return transactions for a company given its id
     */
    public async getCompanyTransactions(companyId: number): Promise<CompanyTransactions | null> {

        return using(this.logEntry.createPerformanceBreakdown('selectCompanyTransactionsData'), async () => {

            // Read companies and find that supplied
            const companyList = await this.jsonReader.readData<Company[]>('data/companyList.json');
            const foundCompany = companyList.find((c) => c.id === companyId);
            if (foundCompany) {

                // Next read transactions from the database
                const companyTransactions =
                    await this.jsonReader.readData<CompanyTransactions[]>('data/companyTransactions.json');

                // Then join the data
                const foundTransactions = companyTransactions.find((ct) => ct.id === companyId);
                if (foundTransactions) {
                    foundTransactions.company = foundCompany;
                    return foundTransactions;
                }
            }

            // Indicate no data found
            return null;
        });
    }

    /*
     * Plumbing to ensure the this parameter is available
     */
    private setupCallbacks(): void {
        this.getCompanyList = this.getCompanyList.bind(this);
        this.getCompanyTransactions = this.getCompanyTransactions.bind(this);
    }
}
