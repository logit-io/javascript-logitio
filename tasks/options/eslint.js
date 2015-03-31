module.exports = function() {

    return {
      options: {
          eslintrc  : true
      },

      src         : [ 'lib/**/*.js' ],
      test        : [ 'test/**/*.js' ]
    };

};
