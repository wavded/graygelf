var graygelf = require('../')

var client = graygelf.createClient({ facility: 'chunked' })
client.on('error', console.error)
console.log('graygelf client sending messages to %s on port %d', client.graylogHost, client.graylogPort)

client.chunkSize = 10 // intentionally make the chunk size small to demonstrate (do not do this normally!)
client.notice('my chunked message', { addn: 'data', _extra: 'field', _id: '2323232323' })
