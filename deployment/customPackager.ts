import AdmZip from 'adm-zip';
import ChildProcess from 'child-process-es6-promise';
import FileSystem from 'fs-extra';
import process from 'process';
import './typings';

class Packager {

    /*
     * Take the file serverless produces and create node_modules folder programmatically
     */
    public async execute(): Promise<void> {

        // Unzip the default packages created by sls package
        await this._unzipPackage('authorizer');
        await this._unzipPackage('serverlessapi');

        // Exclude the service logic from the authorizer
        await this._excludeFolders('authorizer', ['data', 'dist/logic', 'dist/host/lambda']);
        await this._installDependencies('authorizer', []);

        // Exclude the OAuth plumbing from the service lambdas, and remove OAuth dependencies
        await this._excludeFolders('serverlessapi', ['dist/host/authorizer', 'dist/plumbing-oauth']);
        await this._installDependencies('serverlessapi',  ['plumbing-oauth']);

        // Rezip the packages
        await this._rezipPackage('authorizer');
        await this._rezipPackage('serverlessapi');
    }

    /*
     * Unzip a package to a temporary folder for customizing
     */
    private async _unzipPackage(packageName: string) {

        const zip = new AdmZip(`.serverless/${packageName}.zip`);
        zip.extractAllTo(`.serverless/${packageName}`, true);
    }

    /*
     * Remove folders not relevant to this lambda
     */
    private async _excludeFolders(packageName: string, folders: string[]) {

        for (const folder of folders) {
            await FileSystem.remove(`.serverless/${packageName}/${folder}`);
        }
    }

    /*
     * Install dependencies for the package in an optimized manner resulting in smaller lambda sizes
     */
    private async _installDependencies(packageName: string, removeDependencies: string[]) {

        // Copy in package.json files
        await FileSystem.copy('package.json', `.serverless/${packageName}/package.json`);
        await FileSystem.copy('package-lock.json', `.serverless/${packageName}/package-lock.json`);
        await FileSystem.copy('src/plumbing-base/package.json', `.serverless/${packageName}/src/plumbing-base/package.json`);
        await FileSystem.copy('src/plumbing-oauth/package.json', `.serverless/${packageName}/src/plumbing-oauth/package.json`);

        // Remove passed in dependencies and development dependencies
        const pkg = await FileSystem.readJson(`.serverless/${packageName}/package.json`);
        delete pkg.devDependencies;
        delete pkg.scripts;
        for (const dependency of removeDependencies) {
            delete pkg.dependencies[dependency];
        }

        // Write back changes and include formatting
        await FileSystem.writeFile(`.serverless/${packageName}/package.json`, JSON.stringify(pkg, null, 2));

        // Do the work of installing node modules
        await this._installNodeModules(packageName);

        // Remove package.json files from the temporary folder
        await FileSystem.remove(`.serverless/${packageName}/package.json`);
        await FileSystem.remove(`.serverless/${packageName}/package-lock.json`);
        await FileSystem.remove(`.serverless/${packageName}/src`);

        // Remove symbolic links caused by package.json links
        await FileSystem.remove(`.serverless/${packageName}/node_modules/plumbing-base`);
        await FileSystem.remove(`.serverless/${packageName}/node_modules/plumbing-oauth`);
    }

    /*
     * Start a child process to install node modules and wait for it to complete
     */
    private async _installNodeModules(packageName: string) {

        try {
            console.log(`Installing node modules for ${packageName} ...`);
            const npmCommand = /^win/.test(process.platform) ? 'npm.cmd' : 'npm';
            const options = {
                cwd: `.serverless/${packageName}`,
                capture: ['stdout', 'stderr'],
            };
            const childProcess = await ChildProcess.spawn(npmCommand, ['install'], options);
            console.log(childProcess.stdout);
        } catch (e) {
            throw new Error(`Error installing npm packages for ${packageName}: ${e} : ${e.stderr.toString()}`);
        }
    }

    /*
     * Rezip the package ready to deploy as a lambda
     */
    private async _rezipPackage(packageName: string) {

        // Delete the zip package that serverless created
        await FileSystem.remove(`.serverless/${packageName}.zip`);

        // Recreate the zip package
        const zip = new AdmZip();
        zip.addLocalFolder(`.serverless/${packageName}`);
        zip.writeZip(`.serverless/${packageName}.zip`);

        // Delete the temporary folder
        await FileSystem.remove(`.serverless/${packageName}`);
    }
}

(async () => {
    try {
        const packager = new Packager();
        await packager.execute();
    } catch (e) {
        console.log(`Packaging error: ${e}`);
        process.exit(1);
    }
})();
