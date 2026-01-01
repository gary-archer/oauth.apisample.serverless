import path from 'path';
import webpack from 'webpack';
import nodeExternals from 'webpack-node-externals';

/*
 * Performs tree shaking to reduce lambda sizes and improve startup times
 */
const dirname = process.cwd();
const config: webpack.Configuration = {

    // Build for a node.js target
    target: 'node',

    // Always output source maps so that we can decompile bundles
    devtool: 'source-map',

    // Set the working folder
    context: path.resolve(dirname, '.'),

    // Provide each lambda entry point
    entry: {
        getUserInfo: [
            './src/host/lambda/getUserInfo.ts',
        ],
        getCompanyList: [
            './src/host/lambda/getCompanyList.ts',
        ],
        getCompanyTransactions: [
            './src/host/lambda/getCompanyTransactions.ts',
        ],
    },
    module: {
        rules: [
            {
                // Files with a .ts extension are loaded by the Typescript loader
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            }
        ]
    },
    resolve: {

        // Set extensions for import statements, and the .js extension allows us to import modules from JS libraries
        extensions: ['.ts', '.js']
    },
    externals: [
        // For backend projects, we cannot reliably bundle the node_modules folder so exclude it
        nodeExternals()
    ],
    output: {

        // Serverless projects require the library webpack setting
        path: path.resolve(dirname, './dist'),
        filename: '[name].js',
        library: {
            type: 'module'
        },
        module: true,
        clean: true,
    },
    experiments: {
        outputModule: true,
    },
};

export default config;
