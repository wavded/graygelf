# GrayGelf [![Build Status](https://secure.travis-ci.org/wavded/graygelf.png)](http://travis-ci.org/wavded/graygelf)

GrayLog2 GELF streaming, chunking, and more.  A complete GELF implementation including tests.

## Install

```
npm install graygelf
```

## Usage

```js
var gg = require('graygelf')({ host: 'graylog.server.local', facility: 'sample_facility'})

gg.info('Howdy GrayLog')
gg.error('oh no', new Error('bad news'))
```

## Options

```
host: (graylog host)
port: (graylog port)
facility: (graylog facility)
chunkSize: (size of chunked messages in bytes, defaults to 1240)
```

## Syslog Levels

GrayGelf maps the syslog levels to functions as follows:

```js
gg.emerg(...)  // 0
gg.alert(...)  // 1
gg.crit(...)   // 2
gg.error(...)  // 3
gg.warn(...)   // 4
gg.notice(...) // 5
gg.info(...)   // 6
gg.debug(...)  // 7
```

## Chunked Messages

GrayGelf supports sending chunked automatically messages when messages get above a certain size:

```js
gg.chunkSize = 10 // in bytes; defaults to 1240
gg.emerg('some thing more than 10 bytes', 'more detail')
```

## Streaming Messages

Each log level has an associated writeable stream `.stream` that can be used to pipe data into

```js
fs.createReadStream('./data').pipe(gg.info.stream)
```

## License

(The MIT License)

Copyright (c) 2012 Marc Harter <wavded@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
