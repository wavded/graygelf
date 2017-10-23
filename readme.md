[![NPM](https://img.shields.io/npm/v/graygelf.svg)](https://npmjs.com/package/graygelf) [![Build Status](https://secure.travis-ci.org/wavded/graygelf.svg)](http://travis-ci.org/wavded/graygelf) [![Coverage Status](https://coveralls.io/repos/github/wavded/graygelf/badge.svg?branch=master)](https://coveralls.io/github/wavded/graygelf?branch=master) [![code-style](https://img.shields.io/badge/code%20style-adc-brightgreen.svg?style=flat)](https://github.com/applieddataconsultants/eslint-config-adc)

GrayLog2 GELF UDP logging, streaming, chunking, and more. Production hardened. Includes client and server implementations. AFAIK a complete [GELF](http://graylog2.org/gelf#specs) implementation.

![GrayGelf](https://raw.github.com/wavded/graygelf/master/graygelf.png)

# Install

```
npm install graygelf
```

# Example

```javascript
var log = require('graygelf')('graylog.server.local')
log.on('message', console.log) // output messages to console

// setup global custom fields to be passed with every message
log.fields.facility = 'redicomps'

// printf style "hello world"
log.info('hello %s', 'world')

// concat by space style "hello world"
log.info('hello', 'world')

// stays context aware
redis.on('error', log.error)

// include a full message and custom fields using .a(ttach)
log.info.a('short', 'full', { foo: 'bar' })
log.info.a('short', 'full', { foo: 'bar' })

// if an Error is passed as the only argument...
var er = new Error('oh no!')
log.info(er)
// ... it expands to:
log.info.a(er.message, er.stack)

// writable streams can be created
var infostream = log.stream('info')
var rstream = require('fs').createReadStream(__filename)
rstream.pipe(infostream) // lines automatically split up and sent seperately

// raw gelf: version, host, and timestamp will be supplied if missing
log.raw({
  // version: '1.1',
  // host: 'wavded',
  short_message: 'oh no!',
  full_message: 'howdy',
  // timestamp: 1412087767.704356,
  level: 6,
  _foo: 'bar'
})
```

# Setup

By `host` string (uses defaults below for other options):

```javascript
var log = require('graygelf')('graylog.server.local')
```

By `options` object:

```javascript
var log = require('graygelf'){{
  host: 'graylog.server.local',
  port: 23923
})
```

Available `options` are:

```
host
  - graylog host (default: 'localhost')
port
  - graylog port (default: 12201)
chunkSize
  - size of chunked messages in bytes (default: 1240)
compressType
  - compression 'gzip' or 'deflate' (default: 'deflate')
mock
  - don't send messages to GrayLog2 (default: false)
```

# API

## event: error

Emits errors that may occur while parsing and sending GELF messages.

## event: message

Emits GELF JSON messages that will be send over UDP. Useful for redirecting output to stdout in development.

```javascript
log.on('message', function (gelf) {
  console.log(gelf.level, gelf.short_message, gelf.long_message)
})
```

## log.fields

Add global custom fields to be included in every message. Custom fields allow you to more interesting searches and sorting inside GrayLog2 servers.

```javascript
log.fields.facility = 'facility'
```

Note: `fields` is plain JavaScript object.

## log{level}(message)

GrayGelf maps the syslog levels to functions. All functions have the same semantics as `console.log` (i.e. [printf style](http://nodejs.org/api/util.html#util_util_format_format)):

```javascript
log.emerg('oh %s', 's*#t')              // 0 - alias: panic
log.alert('act', 'immediately')         // 1
log.crit('act %j', [ 'really soon' ])   // 2
log.error('expected %d, got %d', 1, 5)  // 3 - alias: err
log.warn('take note, it may bite')      // 4 - alias: warning
log.notice('unusual %s', 'behavior')    // 5
log.info('hello', 'world')              // 6
log.debug('value is', a)                // 7
```

## log{level}.a(short, long, custom)

There also is an `a(ttach)` method to include a full message.

```javascript
log.crit.a('short message', 'full message')
```

The `a(ttach)` method can have an optional third argument to define custom fields that will be passed to Graylog2.

```javascript
log.info.a('short message', 'full message', { custom: 'field' })
```

## log.stream(level)

Create a writable stream to pipe log messages into:

```javascript
var stream = log.stream('info')
```

Streams automatically break lines up and pass each line to GrayLog2 at the specified level.

## log.raw(gelf)

Pass a raw [GELF](http://www.graylog2.org/resources/gelf/specification) message. The following fields will be populated if absent: `version`, `host`, and `timestamp`.

```javascript
log.raw({
  version: '1.1',
  host: 'wavded',
  short_message: 'oh no!',
  full_message: 'howdy',
  timestamp: 1412087767.704356,
  level: 6,
  _foo: 'custom field'
})
```

Note: No global custom fields (`log.fields`) are included when using `log.raw`.

# Server

Make your own GrayLog UDP server or proxy messages to GrayLog. A GrayGelf server handles `zlib`, `gzip` and GELF chunked messages.

## Example

```javascript
var gelfserver = require('graygelf/server')
var server = gelfserver()
server.on('message', function (gelf) {
  // handle parsed gelf json
  console.log('received message', gelf.short_message)
})
server.listen(12201)
```

## event: message

Emits parsed GELF JSON messages.

## event: data

Emits raw GELF buffers (useful for proxying).

## event: error

Emits errors captured from udp or parsing.

## server.listen(port = 12201, address = "0.0.0.0")

Start listening on a port and bind address. Both parameters are optional. Defaults to typical GrayLog2 server defaults.

## server.close()

Close down a server and stop receiving messages.

## server.unref()

Allow the Node process to terminate if the server is the only thing keeping it alive.

## server.pipe(client)

```javascript
var server = require('graygelf/server')().listen()
var client = require('graygelf')('proxy-dest.graylog.local')

server.pipe(client) // establish proxy (straight UDP transfer)
```
