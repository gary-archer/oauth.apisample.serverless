import {inject, injectable} from 'inversify';
import {BASEFRAMEWORKTYPES} from '../../framework-base';
import {LogEntry, using} from '../../framework-base';
import {LOGICTYPES} from '../configuration/logicTypes';
import {Company} from '../entities/company';
import {CompanyTransactions} from '../entities/companyTransactions';
import {JsonFileReader} from '../utilities/jsonFileReader';

/*
 * A repository for getting data about companies
 */
@injectable()
export class CompanyRepository {

    // An injected object to read data from text files
    private readonly _jsonReader: JsonFileReader;

    // Every API request receives its log entry and can contribute to it
    private readonly _logEntry: LogEntry;

    public constructor(
        @inject(LOGICTYPES.JsonFileReader) jsonReader: JsonFileReader,
        @inject(BASEFRAMEWORKTYPES.LogEntry) logEntry: LogEntry) {

        this._jsonReader = jsonReader;
        this._logEntry = logEntry;
        this._setupCallbacks();
    }

    /*
     * Return the list of companies from a hard coded data file
     */
    public async getCompanyList(): Promise<Company[]> {

        return using(this._logEntry.createPerformanceBreakdown('selectCompanyListData'), async () => {

            // Read data from a JSON file into objects
            return await this._jsonReader.readData<Company[]>('data/companyList.json');
        });
    }

    /*
     * Return transactions for a company given its id
     */
    public async getCompanyTransactions(companyId: number): Promise<CompanyTransactions | null> {

        return using(this._logEntry.createPerformanceBreakdown('selectCompanyTransactionsData'), async () => {

            // Read companies and find that supplied
            const companyList = await this._jsonReader.readData<Company[]>('data/companyList.json');
            const foundCompany = companyList.find((c) => c.id === companyId);
            if (foundCompany) {

                // Next read transactions from the database
                const companyTransactions =
                    await this._jsonReader.readData<CompanyTransactions[]>('data/companyTransactions.json');

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
    private _setupCallbacks(): void {
        this.getCompanyList = this.getCompanyList.bind(this);
        this.getCompanyTransactions = this.getCompanyTransactions.bind(this);
    }
}
