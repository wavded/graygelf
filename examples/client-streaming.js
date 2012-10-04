var graygelf = require('../')
var fs = require('fs')

var client = graygelf.createClient({ facility: 'streaming' })
client.on('error', console.error)
console.log('graygelf client sending messages to %s on port %d', client.graylogHost, client.graylogPort)

// streaming by log level
fs.createReadStream(__dirname+'/../package.json').pipe(client.stream.info)
// streams available at all syslog levels: emerg, alert, crit, error, warn, notice, info, debug
