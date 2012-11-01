var graygelf = require('../')

var client = graygelf.createClient({ graylogHost: '127.0.0.1', facility: 'simple' })
client.on('error', console.error)
client.on('message', console.log) // also log message to console

console.log('graygelf client sending messages to %s on port %d', client.graylogHost, client.graylogPort)
client.crit('a critical message!', { details: 'about it', _application: 'custom columns with _' })

// uses standard syslog levels: emerg, alert, crit, error, warn, notice, info, debug
