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
