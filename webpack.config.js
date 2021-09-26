const CopyPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
// const HtmlWebpackPugPlugin = require('html-webpack-pug-plugin')

const config = {
    entry: {
        background: './src/background.ts',
        copy: './src/copy.ts',
        'copy-link': './src/copy-link.ts',
        'options_ui': './src/options_ui/options_ui.ts',
    },
    output: {
        filename: '[name].js',
        path: __dirname + '/dist'
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/, use:
                {
                    loader: 'ts-loader',
                }
            },
            {
                test: /\.pug$/,
                // use: [
                //     // 'html-loader',
                //     'pug-html-loader'
                // ],
                use: [
                    //{
                    //    loader: 'html-loader',
                    //    options: { minimize: false }
                    //},
                    {
                        loader: 'raw-loader',
                    },
                    {
                        loader: 'pug-html-loader',
                        options: { pretty: true }
                    }
                ]
            },
            // { test: /\.styl(us)?$/, use: [ 'vue-style-loader', 'css-loader', 'stylus-loader' ] },
            { test: /\.(gif|svg|jpg|png)$/, loader: "file-loader" },

            // { test: /\.css$/, use: ['style-loader', 'css-loader'] }
        ]
    },
    resolve: {
      extensions: [ '.tsx', '.ts', '.js' ]
    },
    plugins: [
    new HtmlWebpackPlugin({
        template: './src/options_ui/options_ui.pug',
        filename: 'options_ui.html',
    }),
    //new HtmlWebpackPugPlugin({
    //
    //}),
    // new HtmlWebpackPlugin({
    //     template: './options_ui/index.pug',
    //     filename: 'options_ui.html',
    //     inject: true,
    //     chunks: ['main'],
    //     //minify: {
    //     //    sortAttributes: true,
    //     //    collapseWhitespace: false,
    //     //    collapseBooleanAttributes: true,
    //     //    removeComments: true,
    //     //    removeAttributeQuotes: false,
    //     //  }
    // }),
      new CopyPlugin([
        // { from: 'src/options_ui/options_ui.css', to: 'options_ui.css', force: true, toType: 'file' },
        { from: 'src/options_ui/style/', to: 'options_ui_style/', force: true, toType: 'dir' },
        // { from: 'img/', to: 'img/', force: true, toType: 'dir' },
        // { from: 'manifest.json', to: 'manifest.json', force: true, toType: 'file' },
      ]),
    ]
}

module.exports = (env, argv) => {
    console.log('mode =', argv.mode)
    if (argv.mode === 'development') {
        config.devtool = 'source-map';
    }

    if (argv.mode === 'production') {
        //...
    }

    return config
};
