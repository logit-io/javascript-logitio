module.exports = function() {

    return {
      options: {
          jshintrc  : '.jshintrc'
      },
      gruntfile   : [ 'Gruntfile.js', 'tasks/**/*.js' ],
      src         : [ 'lib/**/*.js' ],
      test        : [ 'test/**/*.js' ]
    };

};
