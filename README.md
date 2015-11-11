Logit.io JavaScript Plugin
==========================

This JavaScript Plugin provides websites with an interface to send debug information to a [Logit.io](http://logit.io/) endpoint.

[Logit.io](http://logit.io/) is [TODO]

## Contents

* [Installing](#installing)
* [Using the plugin](#using-the-plugin)
* [License](#license)

# Installing

Logit.io can be installed with:

[Bower](http://bower.io/):

```
bower install --save logitio
```

# Using the plugin

Once the plugin is installed, you do not need to reference any JavaScript, the plugin script will add the `window.logit` object to your window object automatically.

You can then refer to the plugin from anywhere in your code as simply `logit` or `window.logit`.

## Initialization

Before you can use the plugin, you need to initialize it by passing it some setup options by calling the the `init()` function.
The first parameter is required and the second is a bunch of options:

```
window.logit.init( apiKey, options );
```

### init() parameters

- {String} apiKey - (required) your Logit.io API Key, which grants you app access to the endpoint.
- {Object} options - (optional) parameters with the following key names:
    - {Object} defaultDimensions - JSON object describing default dimensions to send with every message. For example, device/OS details, app version details, user details, etc.
    - {Boolean} logToConsole - if true, messages will be logged using window.console methods. Defaults to false.
    - {Integer} verbosity - a value corresponding to an entry in this.LOG_PRIORITIES which filters log messages if the priority value is greater than the verbosity value. Defaults to this.LOG_PRIORITIES.VERBOSE.
    - {Integer} sendInterval - Interval in ms at which to send queued messages. Defaults to 200ms.
    - {Boolean} disableSending - if true, sending of messages to remote Logit endpoint is disabled and messages are not added to send queue. This is useful for development phases when it's useful to use the plugin to log to the console but not to the remote endpoint. Defaults to false.

## Logging messages

The plugin provides the following logging functions, in order of decreasing priority:

- `logit.emergency( message, dimension );`
- `logit.error( message, dimension );`
- `logit.warn( message, dimension );`
- `logit.info( message, dimension );`
- `logit.log( message, dimension );`
- `logit.debug( message, dimension );`
- `logit.trace( message, dimension );`
- `logit.verbose( message, dimension );`

### Parameters

- {String} message - (required) the message to send
- {Object} dimensions - (optional) a list of custom dimensions in key/value form



## Additional functions

The plugin exposes the following additional functions:

- `logit.pauseSending();` Pauses sending of queued messages. Useful to conserve bandwith if you website is doing a bandwith-heavy operation. Note: if the number of queued messages reaches the configured maxQueueSize while sending is paused, each time a new message is added to the queue, the first message will be lost.
- `logit.resumeSending();` Resumes sending of queued messages.
- `logit.setVerbosity( verbosity );` Sets the current verbosity for logit messages.
    - {Mixed} verbosity - new verbosity value to set, either as an integer value of 0 to 7, of as the string name of the corresponding priority (case-insensitive), e.g. "error"
- `logit.getVerbosity();` Returns the current verbosity for logit messages.
- `logit.getPriorityName( priority );` Returns the string name of a log priority given the priority value. Returns null if a matching name is not found.
    - {Integer} priority - numerical priority value to find name for.


License
================

The MIT License

Copyright (c) 2015 Logit.io

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
