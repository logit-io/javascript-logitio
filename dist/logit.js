(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
function factory() {

  function LogitRequest( uri, apikey, onSuccess, onRequestError ) {
    this.uri = uri;
    this.apiKey = apikey;
    this.successCallback = onSuccess || function(){};
    this.onRequestError = onRequestError || function(){};

    this.xhr = this.createXhr();
  }

  function xmlHttpRequest() {
    if ( window.XDomainRequest ) {
      return new window.XDomainRequest();
    }

    if ( window.XMLHttpRequest ) {
      return new window.XMLHttpRequest();
    }

    var xhr = null;
    if ( window.ActiveXObject ) {
      try { xhr = new ActiveXObject("Msxml2.XMLHTTP.6.0"); } catch (_) { }
      try { xhr = new ActiveXObject("Msxml2.XMLHTTP.3.0"); } catch (_) { }
      try { xhr = new ActiveXObject("Msxml2.XMLHTTP"); } catch (_) { }
      try { xhr = new ActiveXObject("Microsoft.XMLHTTP"); } catch (_) { }
    }

    if ( xhr ) {
      return xhr;
    }

    if ( console && console.error ) {
      console.error( "This browser does not support XMLHttpRequest." );
    }
  }

  LogitRequest.prototype = {
    createXhr : function() {
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

    openXhr : function() {
      this.readyState = 0;
      var xhr = this.xhr;

      xhr.open( 'POST', this.uri, true );

      if ( 'setRequestHeader' in xhr ) {
        xhr.setRequestHeader( 'API-Key', this.apiKey );
        xhr.setRequestHeader( 'Content-type', 'application/json' );
      }
    },

    send : function(data) {
      try {
        this.xhr.send( JSON.stringify(data) );
      } catch (e) {
        this.onRequestError( e );
      }
    },

    onreadystatechange : function() {
      var xhr = this.xhr;
      this.readyState = this.xhr.readyState;

      if (xhr.readyState !== 4) return;

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

(function ( root ) {
  if ( typeof exports === 'object' ) module.exports = factory();
  if ( typeof define === 'function' && define.amd ) define( factory );
  root.logit = factory();
}( window || this ));

},{}],2:[function(require,module,exports){
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

},{"./logitRequest":1}]},{},[2]);
