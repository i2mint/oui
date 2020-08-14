const path = require('path');
const webpack = require('webpack');

const sourcePath = path.join(__dirname, './src');
const outPath = path.join(__dirname, './dist');

module.exports = {
    mode: 'development',
    context: sourcePath,
    entry: {
        main: './index.tsx',
    },
    output: {
        library: 'otoTimeVis',
        libraryExport: 'renderTimeChannel',
        libraryTarget: 'amd',
        path: outPath,
        publicPath: '/',
        filename: 'oto-multi-time-vis-min-v0.0.6b.js',
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
        // }, {
        //     test: /\.s?css$/,
        //     use: ['style-loader', 'css-loader', 'sass-loader'],
        // }, {
        //     test: /\.json$/,
        //     loader: 'json-loader',
        }],
    },
    plugins: [],
};
