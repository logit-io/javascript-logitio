module.exports = function() {

    return {
      options: {
          jshintrc  : '.jshintrc'
      },
      
      src         : [ 'lib/**/*.js' ],
      test        : [ 'test/**/*.js' ]
    };

};
