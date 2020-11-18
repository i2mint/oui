const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const sourcePath = path.join(__dirname, './oui');
const outPath = path.join(__dirname, './oui/js');

module.exports = {
    mode: 'production',
    // optimization: {
    //     minimize: false,
    // },
    // node: {
    //     'image-size': false
    // },
    context: sourcePath,
    entry: {
        main: './examples.tsx',
    },
    output: {
        path: outPath,
        publicPath: '/',
        filename: 'examples.js',
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
        // }, {
        //     test: /\.js$/,
        //     use: ['ify-loader'],
        }, {
            test: /\.s?css$/,
            use: ['style-loader', 'css-loader', 'sass-loader'],
        // }, {
        //     test: /\.json$/,
        //     loader: 'json-loader',
        }],
    },
    plugins: [
        new HtmlWebpackPlugin({
            hash: true,
            template: 'index.html',
        }),
    ],
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
