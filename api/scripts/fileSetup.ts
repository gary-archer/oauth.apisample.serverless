import * as FileSystem from 'fs-extra';

class Worker {

    public async execute(): Promise<void> {

        // Produce a package.json in the .build folder with no dev dependencies
        await FileSystem.copy('package.json', '.build/package.json');
        await FileSystem.copy('package-lock.json', '.build/package-lock.json');
        const pkg = await FileSystem.readJson('.build/package.json');
        pkg.devDependencies = {};
        await FileSystem.writeJson('.build/package.json', pkg);

        // Produce an api.config.json file in the .build folder
        await FileSystem.copy('api.config.json', '.build/api.config.json');

        // Copy data files needed by the API
        await FileSystem.copy('data', '.build/data');

        // Remove files that contain only local logic and should no be deployed to AWS
        await FileSystem.remove('.build/local.js');
        await FileSystem.remove('.build/localHttpServer.js');
    }
}

const worker = new Worker();
worker.execute();
