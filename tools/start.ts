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
        stdio: 'inherit',
        shell: process.platform === 'win32',
    }
);

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