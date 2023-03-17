const brfs = require('brfs');

module.exports = {
  cliOptions: {
    dist: 'dist',
    outfileName: 'bundle.js',
    port: 9000,
    src: 'build/src/index.js',
  },
  bundlerCustomizer: bundler => {
    console.log(bundler);
    bundler.transform(brfs);
  },
};
