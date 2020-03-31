const merge = require('webpack-merge');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');
const allPath = require('../path');
const baseConfig = require('./webpack.config.base');


module.exports = merge(baseConfig, {
	entry: allPath.entryPath,
	output: {
		filename: 'bundle.js',
		publicPath: '/',
	},
	module: {
		rules: [
			{
				test: /\.(jsx|js)$/,
				loader: 'eslint-loader',
				exclude: /node_modules/,
				enforce: 'pre',
			},
			{
				test: /\.styl$/,
				use: [
					'style-loader',
					{
						loader: 'css-loader',
						options: {
							importLoaders: 1,
							modules: true,
							sourceMap: true,
							camelCase: true,
							localIdentName: '[name]--[local]--[hash:base64:5]',
						},
					},
					'postcss-loader',
					'stylus-loader',
				],
			},
			{
				test: /\.less/,
				use: ['style-loader', 'css-loader', 'postcss-loader',
					{
						loader: 'less-loader',
						options: {
							modifyVars: {
								'primary-color': '#EA5402',
							},
							javascriptEnabled: true,
						},
					}],
			},
			{
				test: /\.css$/,
				use: [
					'style-loader',
					'css-loader',
					'postcss-loader',
				],
			},
		],
	},
	plugins: [
		new webpack.HotModuleReplacementPlugin(),
		new webpack.NamedModulesPlugin(),
		new webpack.EnvironmentPlugin({
			SERVER_TYPE: 'dev',
		}),
		new webpack.DefinePlugin({
			'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
		}),
		new CopyPlugin([
			{ from: allPath.favIconPath },
			{ from: allPath.wasmPath },
			{ from: allPath.modelPath },
		]),
	],
	devServer: {
		port: 5000,
		host: '0.0.0.0',
		// https: true,
		overlay: {
			errors: true,
		},
		hot: true,
		historyApiFallback: true,
		headers: { 'Access-Control-Allow-Origin': '*' },
		publicPath: '/',
	},
	devtool: '#cheap-module-eval-source-map',
});
