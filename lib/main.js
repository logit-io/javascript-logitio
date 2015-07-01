var LogitRequest = require('./logitRequest');

var LOGIT_URI = 'http://remotehost';

var LOG_PRIORITIES = {
  EMERGENCY: 0,
  ERROR: 1,
  WARN: 2,
  INFO: 3,
  LOG: 4,
  DEBUG: 5,
  TRACE: 6,
  VERBOSE: 7
};

function getConsoleFn( priority ) {
  'use strict';

  if ( !console ) {
    return function() {};
  }

  if ( priority <= LOG_PRIORITIES.ERROR && console.error ) {
    return console.error;
  }

  if ( priority === LOG_PRIORITIES.WARN && console.warn ) {
    return console.warn;
  }

  if ( priority === LOG_PRIORITIES.INFO && console.info ) {
    return console.info;
  }

  if ( priority === LOG_PRIORITIES.DEBUG && console.debug ) {
    return console.debug;
  }

  return console.log;
}

function clone( src ) {
  'use strict';

  var out = {};

  if ( src !== null || typeof src === 'object' ) {
    for (var attr in src) {
      if ( src.hasOwnProperty( attr )) {
        out[ attr ] = src[ attr ];
      }
    }
  }

  return out;
}

function getPriorityName( priority ) {
  'use strict';

  var k, name = null;
  for ( k in LOG_PRIORITIES ) {
    if ( LOG_PRIORITIES[ k ] === priority ) {
      name = k;
      break;
    }
  }

  return name;
}

function factory() {
  'use strict';

  var queue = [];
  var logit = {
    defaultDimensions: {},
    disableSending: false,
    initialised: false,
    logToConsole: false,
    maxQueueSize: 2000,
    sending: false,
    sendInterval: 200,
    verbosity: LOG_PRIORITIES.VERBOSE
  };

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
      if ( logit.disableSending ) {
        logit.disableSending = false;
        checkAndSend();
      }
    },

    getVerbosity: function(){
      return logit.verbosity;
    },

    setVerbosity: function(verbosity) {
      if ( typeof verbosity === 'string' && typeof LOG_PRIORITIES[ verbosity.toUpperCase() ] !== 'undefined' ){
        verbosity = LOG_PRIORITIES[ verbosity.toUpperCase() ];
      }

      if ( typeof verbosity !== 'number' || verbosity < LOG_PRIORITIES.EMERGENCY || verbosity > LOG_PRIORITIES.VERBOSE ) {
        throw new Error( 'verbosity value must be an integer between ' + LOG_PRIORITIES.EMERGENCY + ' and ' + LOG_PRIORITIES.VERBOSE );
      }

      if ( logit.verbosity === verbosity ) {
        return;
      }

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

  for (var logPriority in LOG_PRIORITIES ) {
    moduleInterface[ logPriority.toLowerCase() ] = createPriorityMethod( logPriority );
  }

  function createPriorityMethod( priority ) {
    return function( message, dimensions, opts ) {
      var pkg = createPackage( message, dimensions, opts );

      if (pkg) {
        queuePackage( LOG_PRIORITIES[ priority ], pkg );
      }
    };
  }

  function createPackage( message, dimensions ) {
    dimensions = dimensions || {};

    if ( !logit.initialised ) {
      var consoleFn = getConsoleFn( LOG_PRIORITIES.ERROR );
      consoleFn.call( console, 'Logit.io plugin not initialised; Call logit.init() first.' );
      return null;
    }

    if ( typeof message === 'undefined' || message === '' ) {
      return null;
    }

    if ( logit.defaultDimensions ) {
      for (var k in logit.defaultDimensions) {
        dimensions[ k ] = logit.defaultDimensions[ k ];
      }
    }

    return {
      timestamp: new Date().toISOString(),
      message: message,
      properties: dimensions
    };
  }

  function queuePackage( priority, pkg, opts ) {
    opts = opts || {};

    if ( priority > logit.verbosity && !opts.force ) {
      return;
    }

    var priorityName = getPriorityName( priority );
    pkg.level = priorityName.toLowerCase();

    if ( !logit.disableSending ) {
      pushPackage( pkg );

      checkAndSend();
    }

    if ( console && logit.logToConsole) {
      var consoleFn = getConsoleFn( priority );

      var msg = pkg.message;
      delete pkg.message;
      var details = JSON.stringify( pkg );
      consoleFn.call( console, '[ ' + priorityName + ' ] ' + msg + '; ' + details );
    }
  }

  function pushPackage( pkg ) {
    if ( queue.length >= logit.maxQueueSize ) {
      queue.unshift( 1 );
      logit.disableSending = true;

      moduleInterface.warn( 'Logit message queue message size exceeded', null, { force: true } );
    }

    queue.push( pkg );
  }

  function checkAndSend() {
    if ( !logit.disableSending && !logit.sending ) {
      intervalSend();
    }
  }

  function intervalSend() {
    if ( queue.length && queue.length > 0 && !logit.disableSending ) {
      logit.sending = true;
      var pkg = queue.shift(); // take the first message off the queue
      var request = new LogitRequest( LOGIT_URI, logit.apiKey, logit.onSuccess, onRequestError );

      request.send( pkg );

      setTimeout( intervalSend, logit.sendInterval );

      return;
    }

    logit.sending = false;
  }

  function onRequestError( error ) {
    if ( error.status === 0 ) {
      moduleInterface.warn( error.message, null, { force: true } );
    }
  }

  return moduleInterface;
}

(function ( root ) {
  'use strict';

  if ( typeof exports === 'object' ) {
    module.exports = factory();
  }

  if ( typeof define === 'function' && define.amd ) {
    define( factory );
  }

  root.logit = factory();
}( window ));
