module.exports = function( config ) {

    return {

        dev: {

            options: {
                port: 9001,
                useAvailablePort: true,
                keepalive: true,
                base: [ './dist', './test', './browser', './node_modules' ],
                open: 'http://remotehost:9001'
            }

        }

    };

};
