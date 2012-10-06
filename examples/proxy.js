var graygelf = require('../')

var server1 = graygelf.createServer().listen(12201)
var server2 = graygelf.createServer().listen(12202)

var client1 = graygelf.createClient({ facility: 'proxied' })
var client2 = graygelf.createClient({ port: 12202, facility: 'proxied' })

server1.pipe(client2)

server2.on('message', function (msg) {
  console.log('received message', msg)
})

client1.emerg('my proxied message')
