var graygelf = require('../')

var server = graygelf.createServer().listen(12201)
server.on('message', function (msg) {
  console.log('received message', msg)
})
server.on('error', console.error)
console.log('graygelf server listening on port %d bound to %s', server.port, server.address)

var client = graygelf.createClient({ facility: 'chunked' })
client.on('error', console.error)
console.log('graygelf client sending messages to %s on port %d', client.graylogHost, client.graylogPort)

client.chunkSize = 10 // intentionally make the chunk size small to demonstrate (do not do this normally!)
client.notice('my chunked message', { addn: 'data', _extra: 'field', _id: '2323232323' })
