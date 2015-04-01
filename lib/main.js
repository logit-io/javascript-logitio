function factory() {
    var LogitRequest = require('./logitRequest');

    var LOGIT_URI = 'http://remotehost';
    var sendInterval = 200;
    var maxQueueSize = 2000;

    var LOG_PRIORITIES = {
      EMERGENCY : 0,
      ERROR : 1,
      WARN : 2,
      INFO : 3,
      LOG : 4,
      DEBUG : 5,
      TRACE : 6,
      VERBOSE : 7
    };

    var queue = [];
    var logit = {
      defaultDimensions: {},
      disableSending: false,
      initialised: false,
      logToConsole: false,
      verbosity: LOG_PRIORITIES.VERBOSE,
      sending: false,
    };

    function clone( src ) {
      var out = {};

      if ( null !== src || "object" === typeof src ) {
        for (var attr in src) {
          if ( src.hasOwnProperty( attr )) {
            out[ attr ] = src[ attr ];
          }
        }
      }

      return out;
    }

    function createMessage( priority, message, dimensions, opts ) {
      if ( !logit.initialised && console && console.error ) {
        console.error( 'Logit.io plugin not initialised; Call logit.init() first.' );
        return;
      }

      if ( typeof message === 'undefined' || message === '' ) {
        return;
      }

      opts = opts || {};

      if ( priority > logit.verbosity && !opts.force ) {
        return;
      }

      dimensions = dimensions || {};
      if ( logit.defaultDimensions ) {
        for (var k in logit.defaultDimensions) {
          dimensions[k] = logit.defaultDimensions[k];
        }
      }

      var message = {
        timestamp : new Date().toISOString(),
        message : message,
        level : getPriorityName( priority ).toLowerCase(),
        properties : dimensions
      };

      if ( !logit.disableSending ) {
        if ( queue.length >= maxQueueSize ) {
          queue.unshift( 1 ); // remove first 2 items

          logit.disableSending = true;

          moduleInterface.warn( 'Logit message queue message size exceeded', null, { force: true } );
        }

        queue.push( message );

        checkAndSend();
      }

      if ( console && logit.logToConsole) {
        var consoleFn;

        if (priority <= 1) {
          consoleFn = console.error || console.log;
        } else if (priority == 2) {
          consoleFn = console.warn || console.log;
        } else if (priority == 3) {
          consoleFn = console.info || console.log;
        } else if (priority == 5) {
          consoleFn = console.debug || console.log;
        } else {
          consoleFn = console.log;
        }

        var msg = message.message;
        delete message.message;
        var details = JSON.stringify(message);
        consoleFn.call( console, getPriorityName(priority) + ': ' + msg + '; ' + details );
      }
    };

    function checkAndSend() {
      if ( !logit.disableSending && !logit.sending ) {
        intervalSend();
      }
    }

    function intervalSend() {
      if ( queue.length && queue.length > 0 && !logit.disableSending ) {
        logit.sending = true;
        var message = queue.shift(); // take the first message off the queue
        var request = new LogitRequest( LOGIT_URI, logit.apiKey, logit.onSuccess );

        request.send( message );

        setTimeout( intervalSend, logit.sendInterval );

        return;
      }

      logit.sending = false;
    }

    function onRequestError( error ) {
      if ( error.status == 0 ) {
        moduleInterface.warn( error.message, null, { force: true } );
      }
    }

    function getPriorityName( priority ) {
      var k, name = null;
      for ( k in LOG_PRIORITIES ) {
        if ( LOG_PRIORITIES[k] == priority ) {
          name = k;
          break;
        }
      }

      return name;
    }

    var moduleInterface = {

      init: function( apiKey, options ) {
        if ( typeof apiKey === 'object' ) {
          options = apiKey;
          apiKey = undefined;
        }
        logit = clone( options );
        logit.apiKey = apiKey || logit.apiKey;

        if ( !logit.apiKey || typeof logit.apiKey !== 'string' ) {
          throw new Error( 'API key for Logit endpoint must be specified when initilizing the logit client module' );
        }

        logit.initialised = true;

        checkAndSend();
      },

      pauseSending: function() {
        logit.disableSending = true;
      },

      resumeSending: function() {
        if( logit.disableSending ) {
          logit.disableSending = false;
          checkAndSend();
        }
      },

      getVerbosity: function(){
        return logit.verbosity;
      },

      setVerbosity: function(verbosity) {
        if (typeof verbosity == 'string' && typeof LOG_PRIORITIES[ verbosity.toUpperCase() ] != 'undefined'){
          verbosity = LOG_PRIORITIES[ verbosity.toUpperCase() ];
        }

        if (typeof verbosity != 'number' || verbosity < LOG_PRIORITIES.EMERGENCY || verbosity > LOG_PRIORITIES.VERBOSE) {
          throw new Error( 'verbosity value must be an integer between ' + LOG_PRIORITIES.EMERGENCY + ' and ' + LOG_PRIORITIES.VERBOSE );
        }

        if ( logit.verbosity == verbosity ) return;

        this.info( 'Set logit verbosity', {
          previous: getPriorityName( logit.verbosity ).toLowerCase(),
          current: getPriorityName( verbosity ).toLowerCase()
        }, {
          force: true
        });

        logit.verbosity = verbosity;
      },

      LOG_PRIORITIES: LOG_PRIORITIES
    };

    for (var priority in LOG_PRIORITIES ) {
      moduleInterface[ priority.toLowerCase() ] = function( message, dimensions, opts ) {
        createMessage( LOG_PRIORITIES[ priority ], message, dimensions, opts );
      }
    }

    return moduleInterface;
}

(function ( root ) {
  if ( typeof exports === 'object' ) module.exports = factory();
  if ( typeof define === 'function' && define.amd ) define( factory );
  root.logit = factory();
}( window || this ));
