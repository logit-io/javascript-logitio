module.exports = function() {

  var tests = [ 'test/**/*.js' ];

  return {

    test: {
      options: {
        reporter: 'spec',
      },

      src: tests
    }

  };

};
