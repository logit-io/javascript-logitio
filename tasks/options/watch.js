module.exports = function() {

    return {

        src: {
            files: 'lib/**/*.js',
            tasks: [ 'test', 'build' ]
        }

      , test: {
            files: 'test/**/*.*',
            tasks: [ 'build:test', 'test' ]
        }
    };

};
