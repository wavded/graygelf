# GrayGelf [![Build Status](https://secure.travis-ci.org/wavded/graygelf.svg)](http://travis-ci.org/wavded/graygelf)

GrayLog2 GELF UDP logging, streaming, chunking, and more.  Production tested.  Includes client and server implementations.  AFAIK a complete [GELF](http://graylog2.org/gelf#specs) implementatio

![GrayGelf](https://raw.github.com/wavded/graygelf/master/graygelf.png)

## Install

```
npm install graygelf
```

[![NPM](https://nodei.co/npm/graygelf.png?downloads=true)](https://nodei.co/npm/graygelf)

## Example

```js
var log = require('graygelf')('graylog.server.local')
log.on('message', console.log) // output messages to console

// setup global custom fields to be passed with every message --> converted to '_' fields
log.fields.facility = 'redicomps'

// printf style "hello world"
log.info('hello %s', 'world')

// concat by space style "hello world"
log.info('hello', 'world')

// include a full message and custom fields using .a
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

// raw gelf, version, host, and timestamp will be supplied if missing
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

## Setup

By `host` string (uses defaults below for other options):

```js
var log = require('graygelf')('graylog.server.local')
```

By `options` object:

```js
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

## API

### log[level]
GrayGelf maps the syslog levels to functions.  All functions have the same semantics as `console.log` in Node (e.g. printf style, concat by space):

```js
log.emerg(...)  // 0 - alias: panic
log.alert(...)  // 1
log.crit(...)   // 2
log.error(...)  // 3 - alias: err
log.warn(...)   // 4 - alias: warning
log.notice(...) // 5
log.info(...)   // 6
log.debug(...)  // 7
```

### log[level].a

There also is an `a(ttach)` method to include a full message.

```js
log.crit.a('short message', 'full message')
```

The `a(ttach)` method can have an optional third argument to define custom fields that will be passed to Graylog2 (creating addition search points and columns)

```js
log.info.a('short message', 'full message', { custom, 'field' })
```

### log.stream

Create a writable stream to pipe log messages into:

```js
var stream = log.stream('info')
```

Streams automatically break lines up and pass each line to GrayLog2 at the specified level.

## Server

Make your own GrayLog UDP server or proxy messages to GrayLog

### Usage (callback style)

```js
var server = graygelf.createServer(function (msg) {
  console.log('recieved message', msg)
})
server.on('error', console.error)
server.listen(12201)
```

### Usage (evented style)

```js
var server = graygelf.createServer().listen() // defaults to GrayLog2 port 12201
server.on('message', function (msg) {
  console.log('received message', msg)
})
server.on('error', console.error)
```

### Message Support

GrayGelf handles `zlib`, `gzip` and chunked messages when a message gets above a certain size.

### Efficient GrayLog Proxy and Interceptor

```js
var server = graygelf.createServer().listen(12202) // receive messages here
var client = graygelf.createClient({ host: 'other.server.local', port: 12201 }) // send messages here

server.pipe(client) // establish proxy (straight UDP transfer, no JSON parsing)

server.on('message', function (msg) { // intercept JSON parsed messages
  console.log('received message', msg)
})

client.on('error', console.error)
server.on('error', console.error)
```

## License

(The MIT License)

Copyright (c) 2014 Marc Harter <wavded@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
