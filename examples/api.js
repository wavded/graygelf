var log = require('../')('graylog.adc.int')
log.on('message', console.log)

// setup global fields to be passed with every message --> converted to '_' fields
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