module.exports = function() {

    return {

        coverage: {
            src:    [ 'lib/' ],
            dest:   'coverage/lib/'
        }

      , features: {
            src:    [ 'test/' ],
            dest:   'coverage/test/'
        }

    };

};
