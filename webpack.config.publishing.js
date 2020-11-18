const path = require('path');
const webpack = require('webpack');

const sourcePath = path.join(__dirname, './oui');
const outPath = path.join(__dirname, './oui/js');

module.exports = {
    mode: 'production',
    // optimization: {
    //     minimize: false,
    // },
    context: sourcePath,
    entry: {
        main: './index.ts',
    },
    output: {
        path: outPath,
        publicPath: '/',
        filename: 'index.js',
    },
    target: 'web',
    resolve: {
        modules: [sourcePath, 'node_modules'],
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
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
};
