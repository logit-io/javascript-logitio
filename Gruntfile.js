var glob = require( 'glob' );

function registerCustomGruntTasks(grunt) {
  'use strict';

  grunt.registerTask(
        'serve'
      , 'Starts a dev web server on the first available port starting from 9001 with the build folder as the root.'
      , [ 'connect:dev' ]
  );

  // clean
  // grunt.registerTask('clean'     , [ 'clean' ]);

  // test
  grunt.registerTask('test:coverage', [ 'clean:coverage', 'mocha_istanbul' ]);
  grunt.registerTask('test'         , [ 'jshint', 'eslint', 'mochaTest:test' ]);
  grunt.registerTask('test:browser' , [ 'build:test', 'connect:test', 'saucelabs-mocha:test' ]);

  // build
  grunt.registerTask('build'        , [ 'browserify' ]);
  grunt.registerTask('build:test'   , [ 'browserify:test' ]);

  // auto build
  // grunt.registerTask('default'   , [ 'watch' ]);

  // travis-ci
  grunt.registerTask('ci'           , [ 'test:coverage' ]);
  grunt.registerTask('complexity'   , [ 'complexity' ]);

}

// helper function to load task configs
function loadConfig(path, config) {
  'use strict';

  var o = {};

  glob.sync('*', { cwd: path }).forEach(function( option ) {
    o[ option.replace( /\.js$/, '' ) ] = require( path + option )( config );
  });

  return o;
}

module.exports = function(grunt) {
  'use strict';

  var pkg = grunt.file.readJSON('./package.json');
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

  grunt.event.on('coverage', function(lcov, done){
    require('coveralls').handleInput(lcov, function(err){
      if (err) {
        return done(err);
      }

      done();
    });
  });

  // load grunt tasks
  require('load-grunt-tasks')(grunt);

  // local tasks
  grunt.loadTasks('tasks');

  registerCustomGruntTasks(grunt);
};
