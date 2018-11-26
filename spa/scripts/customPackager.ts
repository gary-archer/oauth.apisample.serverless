import * as FileSystem from 'fs-extra';
import process from 'process';
import './typings';

class Packager {

    /*
     * Copy files into a folder that is easier to deploy to AWS
     */
    public async execute(): Promise<void> {

        await FileSystem.remove('.package');
        await FileSystem.ensureDir('.package/spa');
        await FileSystem.copy('spa.config.json', '.package/spa/spa.config.json');
        await FileSystem.copy('index.html', '.package/spa/index.html');
        await FileSystem.copy('dist', '.package/spa/dist');
        await FileSystem.copy('css', '.package/spa/css');
        await FileSystem.copy('images', '.package/spa/images');
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
