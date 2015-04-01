module.exports = function( grunt ) {
    'use strict';

    // helper function to load task configs

    function loadConfig( path, conf ) {
        var glob = require( 'glob' );

        var object = {}
          , key;

        glob.sync('*', { cwd: path })
            .forEach(function( option ) {
                key = option.replace( /\.js$/, '' );
                object[ key ] = require( path + option )( conf );
            });

        return object;
    }

    // actual config
    var pkg = grunt.file.readJSON('package.json');
    var env = process.env;
    var config = {
        pkg: pkg,
        env: env,
        buildNumber: pkg.version + '.' + ( env.CI_BUILD_NUMBER || 0 ),

        sauce: {
          username: 'mattonfoot',
          accesskey: 'e3a72961-ea21-4c07-9a4c-362a00aebc4d',
        }
    };

    grunt.util._.extend(config, loadConfig( './tasks/options/', config ));

    grunt.initConfig(config);

    // load grunt tasks
    require('load-grunt-tasks')(grunt);

    // local tasks
    grunt.loadTasks('tasks');




    grunt.registerTask(
          'serve'
        , 'Starts a dev web server on the first available port starting from 9001 with the build folder as the root.'
        , [ 'connect:dev' ]
    );

    // clean
    // grunt.registerTask('clean'     , [ 'clean' ]);

    // test
    grunt.registerTask('coverage'     , [ 'clean:coverage', 'blanket', 'copy:coverage', 'mochaTest:instrumented', 'mochaTest:lcov', 'mochaTest:coverage' ]);
    grunt.registerTask('test'         , [ /* 'jshint', 'eslint', 'mochaTest:test' */ ]);
    grunt.registerTask('test:browser' , [ 'build:test', 'connect:test', 'saucelabs-mocha:test' ]);

    // build
    grunt.registerTask('build'        , [ 'browserify' ]);
    grunt.registerTask('build:test'   , [ 'browserify:test' ]);

    // auto build
    // grunt.registerTask('default'   , [ 'watch' ]);

    // travis-ci
    grunt.registerTask('ci'           , [ 'test:browser', 'coverage', 'coveralls' ]);
    grunt.registerTask('complexity'   , [ 'complexity' ]);

};
