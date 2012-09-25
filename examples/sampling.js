var gg = require('../')({ host: 'graylog.adc4gis.local', facility: 'extra_dm' })
gg.on('error', console.error) // handle unexpected errors

gg.emerg('my message', { addn: 'data', _application: 'new one!' })
// gg.alert('my message', { addn: 'data' })
// gg.crit('my message', { addn: 'data' })
// gg.error('my message', { addn: 'data' })
// gg.warn('my message', { addn: 'data' })
// gg.notice('my message', { addn: 'data' })
// gg.info('my message', { addn: 'data' })
// gg.debug('my message', { addn: 'data' })

var fs = require('fs') // streaming by log level
fs.createReadStream('../package.json').pipe(gg.stream.emerg)
