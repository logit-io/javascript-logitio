module.exports = function( config ) {

  return {

    options: {
      hostname: '*',
      port: 9001,
      base: [
        './dist',
        {
          path: './test',
          options: {
            index: 'index.htm'
          }
        },
        './browser',
        './examples',
        './node_modules'
      ],
      debug: true
    },

    dev: {
      options: {
        keepalive: true,
        useAvailablePort: true,
        open: true
      }
    },

    test: {
      options: {
        keepalive: false,
        useAvailablePort: false,
        open: false
      }
    }

  };

};
