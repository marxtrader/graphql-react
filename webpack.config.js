const path = require('path');
const webpack = require('webpack');
var SshWebpackPlugin = require('ssh-webpack-plugin');

// env
const buildDir = './assets/build/';
const entryDir = './src/main.jsx';

var pluginArr = [];
if ((process.env.NODE_ENV === 'testing') || (process.env.NODE_ENV === 'minimize')){
    // for deploy require remote folder structure:
    //  -project_name.war 
    //    |
    //    - assets/
    //    - index.html - for this index page
    const fromPath = './assets';
    const testingHost = 'testing.marx.tech';
    const testingPort = '22';
    const testingUser = 'ec2-user';
    const testingKeyDir = require('fs').readFileSync('./TradingServer.pem');
    const testingRemotePath = '/opt/marx/jboss-eap-6.4-marx/standalone/deployments/reactfront.war/assets';    
    
    testingDeploy = new SshWebpackPlugin({
        host: testingHost,
        port: testingPort,
        username: testingUser,
        privateKey: testingKeyDir,
        from: fromPath,
        before: 'mkdir /opt/marx/jboss-eap-6.4-marx/standalone/deployments/reactfront.war /opt/marx/jboss-eap-6.4-marx/standalone/deployments/reactfront.war/assets',
        after: 'chmod 775 -R /opt/marx/jboss-eap-6.4-marx/standalone/deployments/reactfront.war',
//        cover: false, //important: If the 'cover' of value is false,All files in this folder will be cleared before starting deployment.
        to: testingRemotePath  
    });
    pluginArr.push(testingDeploy);

    if (process.env.NODE_ENV === 'minimize') {
        // for production minimize code
        env = new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify('production')
            }
        });
        pluginArr.push(env);

        uglify = new webpack.optimize.UglifyJsPlugin();
        pluginArr.push(uglify);
    }
}

module.exports = {
  entry: {
     std: path.resolve(entryDir)
//     graph: './src/graphql/Index.jsx'
  },
  devServer: {
    hot: true,
    inline: true,
    port: 8080,
    historyApiFallback: true
  },
  resolve: {
    extensions: ['', '.js', '.jsx']
  },
  output: {
    path: path.resolve(buildDir),
    filename: "[name]_app.js"
//    publicPath: 'https://marx-tech-winter777.c9users.io/dist',
  },
  externals: {
    'cheerio': 'window',
    'react/lib/ExecutionEnvironment': true,
    'react/lib/ReactContext': true
  },
  module: {
    loaders: [
    {
        test: /\.jsx?$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel',
        query: {
            presets: ['react', 'es2015', 'stage-0']
          }
    },
    {
        test: /\.json$/,
        loader: 'json-loader'
    }
//    ,
//    {
//        test: /\.js$/,
//        exclude: /(node_modules|bower_components)/,
//        loader: 'babel-loader',
//        query: {
//            presets: ['env']
//          }
//    }
//    ],
//    rules: [
//    
    ]    
  },
  plugins: pluginArr
};



