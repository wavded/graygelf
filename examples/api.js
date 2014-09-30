var log = require('../')('graylog.adc.int')
log.on('message', console.log)

// setup global fields to be passed with every message --> _ not required
log.fields.facility = 'redicomps'

// printf style "hello world"
log.info('hello %s', 'world')

// concat by space style "hello world"
log.info('hello', 'world')

// use attach() to include a full message
log.info('hello', 'world').attach('full message')

// if an error is passed as the only argument...
var er = new Error('oh no!')
log.info(er)
// ... it expands to:
log.info(er.message).attach(er.stack)

// writable streams can be created
var infostream = log.stream('info')
var rstream = require('fs').createReadStream(__filename)
rstream.pipe(infostream) // lines automatically split up and sent seperately

// raw gelf can be passed if needed
log.raw({
  version: '1.1',
  host: 'wavded',
  short_message: 'oh no!',
  timestamp: 1412087767.704356,
  level: 6
})