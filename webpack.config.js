const path = require('path')

module.exports = {
    entry: path.resolve(__dirname, 'dev_js', 'main.js'),
    output: {
        filename: 'app.js',
        path: path.resolve(__dirname, 'dist', 'js'),
    },
    devServer: {
        port: 4200,
        compress: true,
        hot: true,
        static: {
            directory: path.join(__dirname, 'dist')
        }
    },
    //devtool: 'eval-source-map'
    //devtool: 'source-map'
}