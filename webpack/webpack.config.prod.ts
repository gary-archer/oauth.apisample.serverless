import webpack from 'webpack';
import {merge} from 'webpack-merge';
import {removeSourceMapReferences} from './rewriteSourceMaps.js';
import baseConfig from './webpack.config.base';

const prodConfig: webpack.Configuration =
{
    // Let webpack know this is a release build
    mode: 'production',

    plugins:[
        {
            // In release builds, remove source map references
            apply: (compiler: any) => {
                compiler.hooks.afterEmit.tap('AfterEmitPlugin', () => {
                    removeSourceMapReferences([
                        'getUserInfo.bundle.js',
                        'getCompanyList.bundle.js',
                        'getCompanyTransactions.bundle.js',
                    ]);
                });
            }
        },
    ]
};

export default merge(baseConfig, prodConfig);
