const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const Dotenv = require('dotenv-webpack');
const dotenv = require('dotenv');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  const isDevelopment = argv.mode === 'development';

  // Load environment variables for webpack config usage
  const envFile = isProduction ? '.env.production' : '.env.development';
  const envConfig = dotenv.config({ path: path.resolve(__dirname, envFile) });
  const API_URL = envConfig.parsed?.WIDGET_API_URL || process.env.WIDGET_API_URL || 'http://localhost:5001';

  return {
    entry: './src/index.ts',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'widget.js',
      library: 'IntelligentconvoWidget',
      libraryTarget: 'umd',
      globalObject: 'this',
      clean: true,
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: [
            {
              loader: 'ts-loader',
              options: {
                configFile: path.resolve(__dirname, 'tsconfig.json'),
                transpileOnly: isDevelopment, // Faster builds in dev
              },
            },
          ],
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: [
            'style-loader',
            {
              loader: 'css-loader',
              options: {
                sourceMap: isDevelopment,
              },
            },
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  plugins: [
                    ['autoprefixer'],
                    ...(isProduction ? [['cssnano', { preset: 'default' }]] : []),
                  ],
                },
              },
            },
          ],
        },
      ],
    },
    plugins: [
      new Dotenv({
        path: isProduction ? './.env.production' : './.env.development',
        safe: false,
        systemvars: true,
        defaults: false,
      }),
      new HtmlWebpackPlugin({
        template: './public/demo.html',
        filename: 'demo.html',
        minify: isProduction,
        templateParameters: {
          API_URL: API_URL,
        },
      }),
      new HtmlWebpackPlugin({
        template: './public/index.html',
        filename: 'index.html',
        minify: isProduction,
        inject: false,
      }),
      ...(env && env.analyze ? [new BundleAnalyzerPlugin()] : []),
    ],
    devServer: {
      static: [
        {
          directory: path.join(__dirname, 'dist'),
          publicPath: '/',
        },
        {
          directory: path.join(__dirname, 'public'),
          publicPath: '/',
        }
      ],
      port: 8080,
      hot: true,
      compress: true,
      historyApiFallback: {
        rewrites: [
          { from: /^\/demo$/, to: '/demo.html' },
        ],
      },
      devMiddleware: {
        writeToDisk: true,
      },
    },
    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: isProduction,
              drop_debugger: true,
            },
            format: {
              comments: false,
            },
          },
          extractComments: false,
        }),
        new CssMinimizerPlugin(),
      ],
      // Disable code splitting to ensure single widget.js file
      splitChunks: false,
    },
    devtool: isDevelopment ? 'eval-source-map' : false,
    performance: {
      hints: isProduction ? 'warning' : false,
      maxEntrypointSize: 250000,
      maxAssetSize: 250000,
    },
    externals: isProduction ? {
      // Consider externalizing large dependencies if needed
    } : {},
  };
};