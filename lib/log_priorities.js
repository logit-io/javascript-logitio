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

(function ( root ) {
  'use strict';

  if ( typeof exports === 'object' ) {
    module.exports = LOG_PRIORITIES;
  }

  if ( typeof define === 'function' && define.amd ) {
    define( LOG_PRIORITIES );
  }

  root.logit.LOG_PRIORITIES = LOG_PRIORITIES;
}( window ));
