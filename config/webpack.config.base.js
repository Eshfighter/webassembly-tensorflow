const HtmlWebPackPlugin = require('html-webpack-plugin');
const allPath = require('../path');

module.exports = {
	resolve: {
		modules: [allPath.appNodeModules],
		extensions: ['.js', 'jsx', 'styl'],
	},
	module: {
		rules: [
			{
				test: /\.(js|jsx)$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader',
				},
			},
			{
				test: /\.html$/,
				use: [
					{
						loader: 'html-loader',
						options: { minimize: true },
					},
				],
			},
			{
				test: /\.(gif|jpg|jpeg|png|svg|ico)$/,
				use: [
					{
						loader: 'url-loader',
						options: {
							exclude: [
								/\.html$/,
								/\.(js|jsx)$/,
								/\.css$/,
								/\.styl$/,
							],
							limit: 1024,
							name: 'resources/[path][name]-[hash:8].[ext]',
						},
					},
				],
			},
		],
	},
	plugins: [
		new HtmlWebPackPlugin({
			template: allPath.htmlIndexPath,
			favicon: allPath.favIconPath,
		}),
	],
};
