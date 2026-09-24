import {spawn} from 'child_process';

/*
 * Start serverless offline to handle HTTP requests
 */
console.log('Starting serverless offline ...');
const server = spawn(
    'sls',
    [
        'offline',
        '--config',
        'serverless.yml',
        '--noPrependStageInUrl',
        '--noSponsor',
        '--prefix',
        'investments',
        '--reloadHandler',
        '--host',
        '0.0.0.0',
        '--httpPort',
        '446',
        '--httpsProtocol',
        'certs',
    ],
    {
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: process.platform === 'win32',
    }
);

/*
 * Avoid serverless output of no interest to my API
 */
server.stdout.on('data', (data: any) => {

    const output = data.toString();
    if (!output.includes('(λ:')) {
        process.stdout.write(output);
    }
});

server.stderr.on('data', (data: any) => {

    const output = data.toString();
    if (!output.includes('(λ:')) {
        process.stdout.write(output);
    }
});

/*
 * Run the rollup bundler in watch mode
 */
console.log('Starting rollup build ...');
const rollup = spawn(
    'rollup',
    ['--config', 'build/rollup.config.ts', '--watch'],
    {
        stdio: 'inherit',
        shell: process.platform === 'win32',
        env: {
            ...process.env,
            NODE_OPTIONS: '--import tsx',
        },
    }
);

/*
 * Handle shutdown
 */
function shutdown() {
    rollup.kill();
    server.kill();
    process.exit();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);