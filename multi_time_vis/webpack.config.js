const path = require('path');
const webpack = require('webpack');

const sourcePath = path.join(__dirname, './src');
const outPath = path.join(__dirname, './js');

module.exports = {
    mode: 'development',
    optimization: {
        minimize: false,
    },
    context: sourcePath,
    entry: {
        main: './index.tsx',
    },
    output: {
        path: outPath,
        publicPath: '/',
        filename: 'time-vis.js',
    },
    target: 'web',
    resolve: {
        modules: [sourcePath, 'node_modules'],
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
    },
    externals: {
        fs: true
    },
    module: {
        rules: [{
        //     test: /\.tsx?$/,
        //     enforce: 'pre',
        //     use: ['tslint-loader'],
        // }, {
            test: /\.tsx?$/,
            use: ['awesome-typescript-loader'],
        }, {
            test: /\.s?css$/,
            use: ['style-loader', 'css-loader', 'sass-loader'],
        // }, {
        //     test: /\.json$/,
        //     loader: 'json-loader',
        }],
    },
    plugins: [],
    devServer: {
        contentBase: sourcePath,
        watchContentBase: true,
        compress: true,
        hot: false,
        disableHostCheck: true,
        stats: {
            warnings: false,
        },
        publicPath: '/',
    },
};
