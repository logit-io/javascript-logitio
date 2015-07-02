require('tracekit');
var tracekit = TraceKit;//.noConflict();
var queryString = require('query-string');
var $document;

if (window.$) {
  $document = $(window.document);
}

function forEach( arr, cb ) {
  for ( var i = 0; i < arr.length; i++ ) {
    cb.call( set[i], i, set[i] );
  }
}

function getViewPort () {
    var doc = document.documentElement;
    var body = document.body;
    var x = window.innerWidth || doc.clientWidth || body.clientWidth;
    var y = window.innerHeight || doc.clientHeight || body.clientHeight;

    return { width: x, height: y };
  }


function factory( logit ) {
  'use strict';

  function handleJQueryAjaxError( event, jqXHR, ajaxSettings, thrownError ) {
    var message = 'AJAX Error';

    // ignore ajax abort
    if ( !jqXHR.getAllResponseHeaders() ) {
      return;
    }

    logit.error( thrownError || event.type, {
        status: jqXHR.status,
        statusText: jqXHR.statusText,
        type: ajaxSettings.type,
        url: ajaxSettings.url,
        ajaxErrorMessage: message,
        contentType: ajaxSettings.contentType,
        requestData: ajaxSettings.data && ajaxSettings.data.slice ? ajaxSettings.data.slice(0, 10240) : undefined,
        responseData: jqXHR.responseText && jqXHR.responseText.slice ? jqXHR.responseText.slice(0, 10240) : undefined,
        activeTarget: event.target && event.target.activeElement ? event.target.activeElement.outerHTML : undefined
      });
  }

  function handleException( stackTrace ) {
    var stack = [];
    if ( stackTrace.stack && stackTrace.stack.length ) {
      forEach(stackTrace.stack, function() {
        var frame = this;

        stack.push({
          'LineNumber': frame.line,
          'ColumnNumber': frame.column,
          'ClassName': 'line ' + frame.line + ', column ' + frame.column,
          'FileName': frame.url,
          'MethodName': frame.func || '[anonymous]'
        });
      });
    }

    var qs = queryString.parse( window.location.search );

    var screen = window.screen || {
      width: getViewPort().width,
      height: getViewPort().height,
      colorDepth: 8
    };

    var finalMessage = stackTrace.message || 'Script error';

    var dimensions = {
      'OccurredOn': new Date(),
      'Error': {
        'ClassName': stackTrace.name,
        'Message': finalMessage,
        'StackTrace': stack
      },
      'Environment': {
        'UtcOffset': new Date().getTimezoneOffset() / -60.0,
        'User-Language': navigator.userLanguage,
        'Document-Mode': document.documentMode,
        'Browser-Width': getViewPort().width,
        'Browser-Height': getViewPort().height,
        'Screen-Width': screen.width,
        'Screen-Height': screen.height,
        'Color-Depth': screen.colorDepth,
        'Browser': navigator.appCodeName,
        'Browser-Name': navigator.appName,
        'Browser-Version': navigator.appVersion,
        'Platform': navigator.platform
      },
      'Request': {
        'Url': [location.protocol, '//', location.host, location.pathname, location.hash].join(''),
        'QueryString': qs,
        'Headers': {
          'User-Agent': navigator.userAgent,
          'Referer': document.referrer,
          'Host': document.domain
        }
      }
    };

    logit.error( 'Script error', dimensions );
  }

  function LogitWatch() {
    tracekit.report.subscribe( handleException );

    tracekit.extendToAsynchronousCallbacks();

    if ( $document ) {
      $document.ajaxError( handleJQueryAjaxError );
    }
  }

  return LogitWatch;
}

(function ( root ) {
  'use strict';

  module.exports = factory;
}());
