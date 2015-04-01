var request = require('request');

module.exports = function( config ) {

  return {
    options: {
      username: config.sauce.username,
      key: config.sauce.accesskey,
      urls: [ 'localhost:9001' ],
      build: config.buildNumber,

      onTestComplete: function( result, callback ) {
        var user = config.sauce.username;
        var pass = config.sauce.accesskey;
        var passed = !!result.passed;

        request.put({
            url: [ 'https://saucelabs.com/rest/v1', user, 'jobs', result.job_id ].join('/'),
            auth: { user: user, pass: pass },
            json: { passed: passed }
        }, function ( error, response, body ) {
          if ( error ) {
            callback( error );
          } else if ( response.statusCode !== 200 ) {
            callback( new Error( 'Unexpected response status of [ ' + response.statusCode + ' ]' ) );
          } else {
            callback( null, passed );
          }
        });
      }
    },

    test: {
      options: {
        testname: config.pkg.name,

        browsers: [
//        [ "Windows 2008", "Internet Explorer", 10 ],
          [ "Windows 2008", "Internet Explorer", 9 ],
//        [ "Windows 2003", "Internet Explorer", 8 ],
//        [ "Windows 2003", "Internet Explorer", 7 ],
//        [ "Windows 2003", "Internet Explorer", 6 ],

//        [ "firefox" ],
//        [ "firefox", 3 ],

//        [ "chrome" ],
//        [ "chrome", 26 ],

//        [ "opera" ],
//        [ "opera", 11 ],

//        [ "linux", "firefox" ],
//        [ "linux", "firefox", 3 ],

//        [ "linux", "chrome" ],
//        [ "linux", "chrome", 26 ],

//        [ "linux", "opera" ],
//        [ "linux", "opera", 11 ],

//        [ "Mac 10.8", "Safari", 6 ],
//        [ "Mac 10.6", "Safari", 5 ]

        ]
      }
    }

  };

};
