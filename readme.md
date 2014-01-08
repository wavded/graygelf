# GrayGelf [![Build Status](https://secure.travis-ci.org/wavded/graygelf.png)](http://travis-ci.org/wavded/graygelf)

GrayLog2 GELF logging, streaming, chunking, and more.  Production tested.  Includes client and server implementations.  AFAIK a complete [GELF](https://github.com/Graylog2/graylog2-docs/wiki/GELF) implementation.  Node Core style server and client.

![GrayGelf](https://raw.github.com/wavded/graygelf/master/graygelf.png)

## Install

```
npm install graygelf
```

[![NPM](https://nodei.co/npm/graygelf.png?downloads=true)](https://nodei.co/npm/graygelf)

## Client (i.e. as a logging tool)

### Usage

```js
var graygelf = require('graygelf')
var logger = graygelf.createClient({ host: 'graylog.server.local', facility: 'sample_facility'})
logger.on('error', console.error) // is an EventEmitter

logger.info('Howdy GrayLog')
logger.error('oh no', new Error('bad news'))
logger.log('emerg', 'noes')
```

### Available Options

```
host: (graylog host)
port: (graylog port)
facility: (graylog facility)
chunkSize: (size of chunked messages in bytes, defaults to 1240)
compressType: (type of compression: 'gzip' or 'deflate', defaults to 'deflate')
```

### Syslog Levels

GrayGelf maps the syslog levels to functions as follows:

```js
logger.emerg('short message', 'detailed message')  // 0
logger.alert(...)  // 1
logger.crit(...)   // 2
logger.error(...)  // 3
logger.warn(...)   // 4
logger.notice(...) // 5
logger.info(...)   // 6
logger.debug(...)  // 7

// or manually
logger.log(level, short, full)
```

Each logger function takes two parameters which can be of any type but typically `(string, object)`.

### Chunked Messages

GrayGelf automatically sends chunked messages when a message gets above a certain size:

```js
logger.chunkSize = 10 // in bytes; defaults to 1240
logger.emerg('some thing more than 10 bytes', 'more detail')
```

### Streaming Messages

Each log level has an associated writeable stream `.stream` that can be used to pipe data into

```js
fs.createReadStream('./data').pipe(logger.info.stream)
```

## Server (make your own GrayLog server or intercept messages to GrayLog)

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
