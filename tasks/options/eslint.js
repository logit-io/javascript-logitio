module.exports = function() {

    return {
      options: {
          eslintrc  : true
      },

      gruntfile   : [ 'Gruntfile.js', 'tasks/**/*.js' ],
      src         : [ 'lib/**/*.js' ],
      test        : [ 'test/**/*.js' ]
    };

};
