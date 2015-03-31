module.exports = function() {
  return {
    test: {
      files: {
        'browser/test.js': [ 'test/*.js' ]
      }
    },

    src: {
      files: {
        'dist/logit.js': [ './lib/main.js' ]
      }
    }
  };
};
