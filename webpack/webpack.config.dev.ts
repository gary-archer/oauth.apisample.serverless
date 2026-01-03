import webpack from 'webpack';
import {merge} from 'webpack-merge';
import baseConfig from './webpack.config.base';

const devConfig: webpack.Configuration = {

    // Let webpack know this is a debug build
    mode: 'development',

    // Enable stepping through lambda TypeScript code in the Visual Studio Code debugger
    /*output: Object.assign({}, baseConfig.output, {
        devtoolModuleFilenameTemplate: 'file:///[absolute-resource-path]',
    }),*/
};

export default merge(baseConfig, devConfig);
