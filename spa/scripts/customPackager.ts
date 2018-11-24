import * as FileSystem from 'fs-extra';
import process from 'process';
import './typings';

class Packager {

    /*
     * Copy files into 
     */
    public async execute(): Promise<void> {

        await FileSystem.remove('.package');
        await FileSystem.ensureDir('.package');
        await FileSystem.copy('spa.config.json', '.package/spa.config.json');
        await FileSystem.copy('index.html', '.package/index.html');
        await FileSystem.copy('dist', '.package/dist');
        await FileSystem.copy('css', '.package/css');
        await FileSystem.copy('images', '.package/images');
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
