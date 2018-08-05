import * as FileSystem from 'fs-extra';

class Worker {

    public async execute(): Promise<void> {

        await FileSystem.copy('package.json', '.build/package.json');
        await FileSystem.copy('package-lock.json', '.build/package-lock.json');

        const data = await FileSystem.readJson('.build/package.json');
        data.devDependencies = {};
        await FileSystem.writeJson('.build/package.json', data);
    }
}

const worker = new Worker();
worker.execute();
