function factory( logit ) {
  'use strict';

  var xhrIndex = 0;

  function wrapXHR( xhr ) {
    xhr.watchedByLogit = true;

    var fn = xhr.onreadystatechange;
    xhr.onreadystatechange = function( event ) {
      var message = 'Unknown state found for XHR';
      switch (this.readyState) {
        case 0:
          xhrIndex++;
          message = 'UNSENT - Client has been created. open() not called yet.';
          break;
        case 1:
          message = 'OPENED - open() has been called.';
          break;
        case 2:
          message = 'HEADERS_RECEIVED - send() has been called, and headers and status are available.';
          break;
        case 3:
          message = 'LOADING - Downloading; responseText holds partial data.';
          break;
        case 4:
          message = 'DONE - The operation is complete.';
          break;
      }

      logit.log(message, {
          xhrRequestId: xhrIndex,
          status: this.status,
          statusText: this.statusText,
          type: this.responseType,
          url: this.responseURL,
          ajaxErrorMessage: this.status && (this.status < 200 || this.status > 299) ? this.response : undefined,
          contentType: this.contentType,
          requestData: this.response && this.response.slice ? this.response.slice(0, 10240) : undefined,
          responseData: this.responseText && this.responseText.toString().slice ? this.responseText.toString().slice(0, 10240) : undefined,
          activeTarget: event.target && event.target.activeElement ? event.target.activeElement.outerHTML : undefined
      });

      return fn.call( this, event );
    };

    return xhr;
  }

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

  if (window.$) {
    var $document = $(window.document);

    if ( $document ) {
      $document.ajaxError( handleJQueryAjaxError );
    }
  }

  return wrapXHR;
}

(function () {
  'use strict';

  module.exports = factory;
}());
