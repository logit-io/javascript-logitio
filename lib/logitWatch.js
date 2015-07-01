function factory() {
  'use strict';
}

(function ( root ) {
  'use strict';

  if ( typeof exports === 'object' ) {
    module.exports = factory();
  }

  if ( typeof define === 'function' && define.amd ) {
    define( factory );
  }

  (root.logit = root.logit || {}).watch = factory;
}( window ));
