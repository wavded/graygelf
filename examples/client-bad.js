var graygelf = require('../')

var client = graygelf.createClient({ host: '1.2.3.4.5' })
client.on('error', console.error)
client.crit('a critical message!', { details: 'about it', _application: 'custom columns with _' })

// uses standard syslog levels: emerg, alert, crit, error, warn, notice, info, debug
