function factory() {

    var LOGIT_URI = 'http://remotehost';
    var sendInterval = 200;
    var maxQueueSize = 10;

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

    function emergency(message, dimensions, opts) {
      createMessage( LOG_PRIORITIES.EMERGENCY, message, dimensions, opts );
    }

    function error(message, dimensions, opts) {
      createMessage( LOG_PRIORITIES.ERROR, message, dimensions, opts );
    }

    function warn(message, dimensions, opts) {
      createMessage( LOG_PRIORITIES.WARN, message, dimensions, opts );
    }

    function info(message, dimensions, opts) {
      createMessage( LOG_PRIORITIES.INFO, message, dimensions, opts );
    }

    function log(message, dimensions, opts) {
      createMessage( LOG_PRIORITIES.LOG, message, dimensions, opts );
    }

    function debug(message, dimensions, opts) {
      createMessage( LOG_PRIORITIES.DEBUG, message, dimensions, opts );
    }

    function trace(message, dimensions, opts) {
      createMessage( LOG_PRIORITIES.TRACE, message, dimensions, opts );
    }

    function verbose(message, dimensions, opts) {
      createMessage( LOG_PRIORITIES.VERBOSE, message, dimensions, opts );
    }

    function createMessage( priority, message, dimensions, opts ) {
      if (!logit.initialised) {
        console.error( 'Logit.io plugin not initialised; Call logit.init() first.' );
        return;
      }
      if ( typeof message === 'undefined' || message === '' ) return;

      opts = opts || {};

      if ( priority > logit.verbosity && !opts.force ) return;

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
          if ( queue.length == maxQueueSize ) {
              queue.unshift(); //remove first item

              logit.disableSending = true;

              warn( 'Logit message queue message size exceeded', null, { force: true } );
          }

          queue.push( message );

          checkAndSend();
      }

      if ( console && logit.logToConsole) {
          var consoleFn;
          if (priority <= 1) {
              consoleFn = console.error;
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
      if ( !logit.disableSending && !logit.sending ) intervalSend();
    }

    function intervalSend(){
      if ( queue.length && queue.length > 0 && !logit.pausedSending ) {
        logit.sending = true;
        var message = queue.shift(); // take the first message off the queue
        var request = new LogitRequest();
        request.send( message );

        setTimeout( intervalSend, logit.sendInterval );

        return;
      }

      logit.sending = false;
    }

    function onRequestError( error ) {
      if (error.status == 0) {
        warn( error.message, null, { force: true } );
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

    function LogitRequest() {
      this.uri = LOGIT_URI;
      this.apiKey = logit.apiKey;
      this.successCallback = logit.onSuccess || function(){};

      this.xhr = this.createXhr();
    }

    LogitRequest.prototype = {
      createXhr : function() {
          var xhr = this.xhr = new XMLHttpRequest();
          this.openXhr();
          xhr.timeout = 10000;

          if ( 'withCredentials' in xhr ) {
            xhr.onreadystatechange = this.onreadystatechange.bind(this);

          } else if ( window.XDomainRequest ) {
            xhr.ontimeout = function () {
              var error = new Error();
                  error.code = xhr.status;
                  error.statusText = xhr.statusText;
                  error.uri = this.uri;

                  error.message = 'Request timed out';

              return this.failureCallback( error );
            };
          }

          if (!xhr) {
            log( 'CORS not supported' );
            return;
          }

          return xhr;
      },

      openXhr : function() {
        this.readyState = 0;
        var xhr = this.xhr;

        if ( 'withCredentials' in xhr ) {
          xhr.open( 'POST', this.uri, true );
        } else if ( window.XDomainRequest ) {
          xhr = this.xhr = new window.XDomainRequest();
          xhr.open( 'POST', this.uri );
        }

        xhr.setRequestHeader( 'API-Key', this.apiKey );
        xhr.setRequestHeader( 'Content-type', 'application/json' );
      },

      send : function(data) {
        try {
          this.xhr.send(JSON.stringify(data));
        } catch (e) {
          this.failureCallback(e);
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

              return this.failureCallback( error );
          }
        }

        this.successCallback( xhr.responseText );
      },

      failureCallback: function( e ) {
        onRequestError( e );
      }
    };

    return {

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
        logit.pausedSending = true;
      },

      resumeSending: function() {
        if( logit.pausedSending ) {
          logit.pausedSending = false;
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

        info( 'Set logit verbosity', {
           previous: getPriorityName( logit.verbosity ).toLowerCase(),
           current: getPriorityName( verbosity ).toLowerCase()
        }, {
            force: true
        });

        logit.verbosity = verbosity;
      },

      emergency: emergency,
      error: error,
      warn: warn,
      info: info,
      log: log,
      debug: debug,
      trace: trace,
      verbose: verbose,

      LOG_PRIORITIES: LOG_PRIORITIES
    };

    function clone( src ) {
      var out = {};

      if ( null !== src || "object" === typeof src ) {
        for (var attr in src) {
          if ( src.hasOwnProperty( attr )) out[ attr ] = src[ attr ];
        }
      }

      return out;
    }
}

(function ( root ) {
  if ( typeof exports === 'object' ) module.exports = factory();
  if ( typeof define === 'function' && define.amd ) define( factory );
  root.logit = factory();
}( window || this ));
