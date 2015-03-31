var chai = require('chai');

var should = chai.should();
var expect = chai.expect;

describe('Logit javascript appender', function() {

  beforeEach(function() {
    var fixture = this;

    fixture.xhr = sinon.useFakeXMLHttpRequest();
    fixture.sandbox = sinon.sandbox.create();

    fixture.requests = [];

    fixture.xhr.prototype.onSend = function( xhr ) {
      fixture.requests.push( xhr );
    };

    fixture.sandbox.stub( console, 'log' );
    fixture.sandbox.stub( console, 'error' );
  });

  afterEach(function() {
    var fixture = this;

    fixture.xhr.restore();
    fixture.sandbox.restore();

    fixture.requests = [];
  });

  describe('logit', function() {
    it('is available on the global window context', function() {
      should.exist( window.logit );

      window.logit.should.have.property( 'init' );
    });

    it('is initialised by passing an API key to the logit.init method', function() {
      should.exist( window.logit.init );

      should.not.throw(function() {
        window.logit.init( 'abc123' );
      });

      this.requests.length.should.equal( 0 );
    });

    describe('logit.init', function() {
      it('cannot be called without an API key', function() {
        should.throw(function() {
          window.logit.init();
        });
      });

      it('will cause logging to fail gracefully, if not initialised, placing an error into the browser console, if available.', function() {
        should.not.throw(function() {
          window.logit.log( 'Not initialised, attempt' );
        });

        console.log.should.not.have.been.called;
        console.error.should.have.been.called;

        this.requests.length.should.equal( 0 );
      });

      it('No message can be sent to the logit.IO server until it is initialised', function() {
        should.throw(function() {
          window.logit.init();
        });

        window.logit.log( 'Not initialised, attempt 1' );
        this.requests.length.should.equal( 0 );

        window.logit.log( 'Not initialised, attempt 2' );
        this.requests.length.should.equal( 0 );

        window.logit.init( 'abc123' );

        var msg = 'Sent to server!';
        window.logit.log( msg );
        this.requests.length.should.equal( 1 );

        var data = JSON.parse( this.requests[ 0 ].requestBody );
        data.message.should.equal( msg );
      });
    });
  });

  describe('logging priorities', function() {
    var levels = {
      emergency: 'error',
      error: 'error',
      warn: 'log',
      info: 'log',
      log: 'log',
      debug: 'log',
      trace: 'log',
      verbose: 'log'
    };
    for ( var level in levels ) {

      var priority = level.toUpperCase();

      describe('logit.LOG_PRIORITIES.' + priority, function() {
        beforeEach(function(){
          window.logit.init( 'abc123' );
        });

        it('is a key defined by a global variable', function() {
          should.exist( window.logit.LOG_PRIORITIES[ priority ] );
        });

        it('has a corresponding logit.' + level + ' method', function() {
          should.exist( window.logit[ level ] );
        });

        it('is applied to a message when the corresponding logit.' + level + ' method is called', function() {
          var msg = 'Hey there';

          window.logit[ level ]( msg );

          this.requests.length.should.equal( 1 );

          var data = JSON.parse( this.requests[ 0 ].requestBody );
          data.message.should.equal( msg );
          data.level.should.equal( level );

          console.log.should.not.have.been.called;
          console.error.should.not.have.been.called;
        });

        it('will ignore empty or undefined messages.', function() {
          window.logit[ level ]( '' );
          window.logit[ level ]();

          this.requests.length.should.equal( 0 );

          console.log.should.not.have.been.called;
          console.error.should.not.have.been.called;
        });
      });

    }
  });

  describe('configuring options for logging when calling logit.init', function() {
    it('accepts [apiKey] passed as an option on an options object', function() {
      var options = {
        apiKey: 'abc123'
      };

      should.not.throw(function() {
        window.logit.init( options );
      });
    });

    it('accepts a [defaultDimensions] object on the options object', function() {
      var options = {
        defaultDimensions: { x: 1, y: 2, z: 3 }
      };

      should.not.throw(function() {
        window.logit.init( 'abc123', options );
      });
    });

    describe('setting default dimensions', function() {
      var options = {
        defaultDimensions: { x: 1, y: 2, z: 3 }
      };

      beforeEach(function() {
        window.logit.init( 'abc123', options );
      });

      it('will include the default dimensions in a message if none are set when sending messages to logit', function() {
        window.logit.log( 'message with dimensions' );

        this.requests.length.should.equal( 1 );

        var data = JSON.parse( this.requests[ 0 ].requestBody );
        data.properties.should.deep.equal( options.defaultDimensions );
      });

      it('will include the default dimensions in a message along with the passed dimensions', function() {
        var messageDimension = { a: 4 };

        window.logit.log( 'message with dimensions', messageDimension );

        this.requests.length.should.equal( 1 );

        var data = JSON.parse( this.requests[ 0 ].requestBody );
        should.exist( data.properties.x );
        data.properties.x.should.equal( options.defaultDimensions.x );
        should.exist( data.properties.y );
        data.properties.y.should.equal( options.defaultDimensions.y );
        should.exist( data.properties.z );
        data.properties.z.should.equal( options.defaultDimensions.z );
        should.exist( data.properties.a );
        data.properties.a.should.equal( messageDimension.a );
      });

      it('will not override dimensions set when sending messages to logit', function() {
        var messageDimension = { z: 4 };

        window.logit.log( 'message with dimensions', messageDimension );

        this.requests.length.should.equal( 1 );

        var data = JSON.parse( this.requests[ 0 ].requestBody );
        should.exist( data.properties.x );
        data.properties.x.should.equal( options.defaultDimensions.x );
        should.exist( data.properties.y );
        data.properties.y.should.equal( options.defaultDimensions.y );
        should.exist( data.properties.z );
        data.properties.z.should.equal( messageDimension.z );
      });
    });

    it('accepts a [logToConsole] boolean on the options object', function() {
      var options = {
        logToConsole: true
      };

      should.not.throw(function() {
        window.logit.init( 'abc123', options );
      });
    });

    describe('enabling console logging', function() {
      it.skip('will write messages to the available global console when sending messages to logit', function() {

      });

      it.skip('will write error messages to the available global console when sending messages to logit with a priority of ERROR or EMERGENCY', function() {

      });
    });

    it('accepts a [verbosity] level on the options object', function() {
      var options = {
        verbosity: window.logit.LOG_PRIORITIES.ERROR
      };

      should.not.throw(function() {
        window.logit.init( 'abc123', options );
      });
    });

    describe('setting default verbosity', function() {
      it.skip('has a default verbosity of VERBOSE if this option is not set', function() {

      });

      it.skip('will cause any message with a lower priority level to be ignored', function() {

      });
    });
  });

  describe('sending messages', function() {
    it.skip('message text length', function() {

    });

    it.skip('message encoding', function() {

    });

    it.skip('using obscure characters in messages', function() {

    });

    describe('message dimensions', function() {
      it.skip('overriding defaults', function() {

      });
    });

    it.skip('forcing a message to be sent', function() {

    });
  });

  describe('changing verbosity levels during execution', function() {
    it.skip('get current verbosity level', function() {

    });

    it.skip('changing verbosity levels', function() {

    });
  });

  describe('pausing message sending during execution', function() {
    it.skip('pausing message sending', function() {

    });

    it.skip('message sending automatically paused when the buffer is full', function() {

    });

    it.skip('resuming message sending', function() {

    });
  });

  describe('overloading the message buffer', function() {

    describe.skip('will cause logging to pause, placing an error into the browser console, if available.', function() {

      beforeEach(function() {
        window.logit.init( 'abc123' );
      });

      it('will drop message and present console message if the buffer is to large', function() {
        var fixture = this;

        for ( var i = 0; i < 2010; i++) {
          window.logit.log( 'test message' );
        }

        console.log.should.not.have.been.called;
        console.error.should.not.have.been.called;
      });
    });
  });
});
