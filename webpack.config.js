const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');

const PATHS = {
    src: path.join(__dirname, 'src'), //absolute path to RepoDir/src
    dist: path.join(__dirname, 'dist') //absolute path to RepoDir/dist
}
module.exports = {
    entry: {
        //Webpack will automatically resolve it to RepoDir/src/js/index.js (if file name is not specified)
        //main: PATHS.src + '/js/app.js' //Webpack will resolve it to RepoDir/src/js/app.js
        main: PATHS.src + '/js'
    },
    output: {
        //Will resolve to RepoDir/dist 
        path: PATHS.dist,
        //[name] is placeholder for entry ie.. main from line `12`
        //So output file name will be main<somehash>.js
        filename: 'js/[name].js'
    },
    plugins: [
        new CopyWebpackPlugin({
			patterns: [
				{
					//Note:- No wildcard is specified hence will copy all files and folders
					from: 'src/assets', //Will resolve to RepoDir/src/assets 
					to: 'assets' //Copies all files from above dest to dist/assets
				},
				{
					from: 'src/css',
					to: 'css'
				},
				{
					from: 'src/index.html',
					to: 'index.html'
				},
				{
					from: 'src/assets/favicon.ico',
					to: 'favicon.ico'
				},
				{
					from: 'node_modules/codemirror/lib/codemirror.css',
					to: 'css'
				},
				{
					from: 'node_modules/codemirror/lib/codemirror.js',
					to: 'js'
				},
				{
					from: 'node_modules/material-components-web/dist/material-components-web.min.css',
					to: 'css'
				},
				{
					from: 'node_modules/material-components-web/dist/material-components-web.min.js',
					to: 'js'
				},
				{
					from: 'node_modules/sql.js/dist/sql-wasm.js',
					to: 'js'
				},
				{
					from: 'node_modules/sql.js/dist/sql-wasm.wasm',
					to: 'js'
				},
				{
					from: 'node_modules/sql.js/dist/worker.sql-wasm.js',
					to: 'js'
				}
			]
		})
    ]
}