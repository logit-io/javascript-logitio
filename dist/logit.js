(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
function factory( ActiveXObject ) {
  'use strict';

  function LogitRequest( uri, apikey, onSuccess, onRequestError ) {
    this.uri = uri;
    this.apiKey = apikey;
    this.successCallback = onSuccess || function(){};
    this.onRequestError = onRequestError || function(){};

    this.xhr = this.createXhr();
  }

  function getActiveXObject() {
    if ( window.ActiveXObject ) {
      try {
        return new ActiveXObject('Msxml2.XMLHTTP.6.0');
      } catch (_) { }
      try {
        return new ActiveXObject('Msxml2.XMLHTTP.3.0');
      } catch (_) { }
      try {
        return new ActiveXObject('Msxml2.XMLHTTP');
      } catch (_) { }
      try {
        return new ActiveXObject('Microsoft.XMLHTTP');
      } catch (_) { }
    }
  }

  function xmlHttpRequest() {
    if ( window.XDomainRequest ) {
      return new window.XDomainRequest();
    }

    if ( window.XMLHttpRequest ) {
      return new window.XMLHttpRequest();
    }

    var xhr = getActiveXObject();

    if ( xhr ) {
      return xhr;
    }

    if ( console && console.error ) {
      console.error( 'This browser does not support XMLHttpRequest.' );
    }
  }

  LogitRequest.prototype = {
    createXhr: function() {
      var xhr = this.xhr = xmlHttpRequest();

      if ( xhr ) {
        this.openXhr();
        xhr.timeout = 10000;

        xhr.onreadystatechange = this.onreadystatechange.bind( this );
        xhr.process = function() {};
        xhr.ontimeout = function () {
          var error = new Error();
              error.code = xhr.status;
              error.statusText = xhr.statusText;
              error.uri = this.uri;

              error.message = 'Request timed out';

          return this.onRequestError( error );
        };
      }

      return xhr;
    },

    openXhr: function() {
      this.readyState = 0;
      var xhr = this.xhr;

      xhr.open( 'POST', this.uri, true );

      if ( 'setRequestHeader' in xhr ) {
        xhr.setRequestHeader( 'API-Key', this.apiKey );
        xhr.setRequestHeader( 'Content-type', 'application/json' );
      }
    },

    send: function(data) {
      try {
        this.xhr.send( JSON.stringify(data) );
      } catch (e) {
        this.onRequestError( e );
      }
    },

    onreadystatechange: function() {
      var xhr = this.xhr;
      this.readyState = this.xhr.readyState;

      if (xhr.readyState !== 4) {
        return null;
      }

      if ( xhr.status !== 202 ) {
        if ( !xhr.responseText || xhr.responseText.charAt(0) !== '{' ) {
          var error = new Error();
              error.code = xhr.status;
              error.statusText = xhr.statusText;
              error.uri = this.uri;

          if ( xhr.responseText.charAt(0) !== '{' ) {
            error.message = 'No connection';
          } else {
            error.message = 'Invalid server response';
          }

          return this.onRequestError( error );
        }
      }

      this.successCallback( xhr.responseText );
    }
  };

  return LogitRequest;
}

(function ( root, ActiveXObject ) {
  'use strict';

  if ( typeof exports === 'object' ) {
    module.exports = factory( ActiveXObject );
  }

  if ( typeof define === 'function' && define.amd ) {
    define( factory );
  }

  (root.logit = root.logit || {}).LogitRequest = factory( ActiveXObject );
}( window, window.ActiveXObject ));

},{}],2:[function(require,module,exports){
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

},{"./logitRequest":1}]},{},[2]);
