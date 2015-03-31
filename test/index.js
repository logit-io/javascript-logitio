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
    it('should be available', function() {
      should.exist( window.logit );

      window.logit.should.have.property( 'init' );
    });
  });

  describe('logit.init', function() {
    it('when called', function() {
      should.throw(function() {
        window.logit.init();
      });
    });

    it('when called with an apikey', function() {
      should.not.throw(function() {
        window.logit.init( 'abc123' );
      });

      this.requests.length.should.equal( 0 );
    });
  });

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

    describe('logit.' + level, function() {
      beforeEach(function(){
        window.logit.init( 'abc123' );
      });

      it('when called', function() {
        window.logit[ level ]();

        this.requests.length.should.equal( 0 );

        console[ levels[ level ] ].should.not.have.been.called;
      });

      it('when called with a message', function() {
        var msg = 'Hey there';

        window.logit[ level ]( msg );

        this.requests.length.should.equal( 1 );

        var data = JSON.parse( this.requests[ 0 ].requestBody );
        data.message.should.equal( msg );
        data.level.should.equal( level );

        console[ levels[ level ] ].should.not.have.been.called;
      });
    });

  }

  // LOG_PRIORITIES static values

  // console logging correctly

  // message text length, encoding

  // message dimensions

  // get verbosity

  // change verbosity

  // pause sending

  // resume sending

  // force option
});
