import * as FileSystem from 'fs-extra';
import * as Path from 'path';

class Worker {

    public async execute(): Promise<void> {

        const buildFolder = Path.join(__dirname, '../.build');
        if (await FileSystem.exists(buildFolder)) {
            await FileSystem.remove(buildFolder);
        }
        await FileSystem.ensureDir(buildFolder);
    }
}

const worker = new Worker();
worker.execute();
