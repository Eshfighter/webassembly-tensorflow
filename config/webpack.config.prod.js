const merge = require('webpack-merge');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CompressionWebpackPlugin = require('compression-webpack-plugin');
const webpack = require('webpack');
const baseConfig = require('./webpack.config.base');
const allPath = require('../path');

module.exports = merge(baseConfig, {
	entry: {
		app: allPath.entryPath,
		vendor: ['react', 'react-dom'],
	},
	output: {
		filename: '[name].[chunkhash:8].js',
		path: allPath.buildPath,
		publicPath: '/',
	},
	plugins: [
		new MiniCssExtractPlugin({
			filename: '[name].[chunkhash:8].css',
			chunkFilename: '[id].[chunkhash:8].css',
		}),
		new CompressionWebpackPlugin({
			filename: '[path].gz[query]',
			algorithm: 'gzip',
			test: new RegExp('\\.(js|css)$'),
			threshold: 10240,
			minRatio: 0.8,
		}),
		new webpack.DefinePlugin({
			'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
		}),
		new CopyPlugin([
			{ from: allPath.favIconPath },
			{ from: allPath.wasmPath },
			{ from: allPath.modelPath },
		]),
	],
	module: {
		rules: [
			{
				test: /\.styl$/,
				use: [
					{
						loader: MiniCssExtractPlugin.loader,
					},
					{
						loader: 'css-loader',
						options: {
							modules: true,
							localIdentName: '[hash:base64:5]',
							camelCase: true,
						},
					},
					{
						loader: 'postcss-loader',
						options: {
							sourceMap: true,
						},
					},
					'stylus-loader',
				],
			},
			{
				test: /\.less/,
				use: [
					{
						loader: MiniCssExtractPlugin.loader,
					},
					'css-loader',
					'postcss-loader',
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
					{
						loader: MiniCssExtractPlugin.loader,
					},
					'css-loader',
					'postcss-loader',
				],
			},
		],
	},
	optimization: {
		namedChunks: true,
		namedModules: true,
		minimize: true,
		minimizer: [
			new TerserPlugin(),
			new OptimizeCSSAssetsPlugin({}),
		],
		runtimeChunk: {
			name: () => 'manifest',
		},
		splitChunks: {
			chunks: 'initial',
			minSize: 30000,
			maxSize: 0,
			minChunks: 1,
			maxAsyncRequests: 5,
			maxInitialRequests: 3,
			automaticNameDelimiter: '~',
			name: true,
			cacheGroups: {
				vendors: {
					test: /[\\/]node_modules[\\/]/,
					priority: -10,
				},
				default: {
					minChunks: 2,
					priority: -20,
					reuseExistingChunk: true,
				},
			},
		},
	},
	devtool: '#cheap-module-source-map',
});
