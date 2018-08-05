import * as FileSystem from 'fs-extra';
import * as Path from 'path';

/*
 * A class to prepare files before adding them to the upload zip file, in order to reduce AWS upload size
 */
class Builder {

    /*
     * The build function
     */
    public async execute(): Promise<void> {
        
        try {
            await this._createBuildFolder();
            await this._copySource();
            await this._removeDevDependencies();
            console.log(`BUILD: Completed successfully`);
        }
        catch(e) {
            console.log(`BUILD: Failed: ${e}`);
        }
    }

    /*
     * Delete the build folder if it exists already
     */
    private async _createBuildFolder(): Promise<void> {

        let buildFolder = Path.join(__dirname, '../build');
        if (await FileSystem.exists(buildFolder)) {
            console.log(`BUILD: Deleting build folder`);
            await FileSystem.remove(buildFolder);
        }

        console.log(`BUILD: Creating build folder`);
        await FileSystem.ensureDir(buildFolder);
    }

    /*
     * Copy source files to the build folder
     */
    private async _copySource(): Promise<void> {
        console.log(`BUILD: Copying files for deployment to AWS to build folder`);
        await FileSystem.copy('src', 'build/src');
        await FileSystem.copy('package.json', 'build/package.json');
        await FileSystem.copy('package-lock.json', 'build/package-lock.json');
    }

    /*
     * Remove development dependencies that AWS does not need, since otherwise uploads are huge
     */
    private async _removeDevDependencies(): Promise<void> {
        console.log(`BUILD: Removing development dependencies from package.json`);
        const data = await FileSystem.readJson('build/package.json');
        data.devDependencies = {};
        await FileSystem.writeJson('build/package.json', data);
    }
}

// Start the build
let builder = new Builder();
builder.execute();