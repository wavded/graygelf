var graygelf = require('../')

var server = graygelf.createServer(function (msg) {
  console.log('received message', msg)
})
server.listen(12201)
server.on('error', console.error)
console.log('graygelf server listening on port %d bound to %s', server.port, server.address)

// OR

var server = graygelf.createServer().listen(12201)
server.on('message', function (msg) {
  console.log('received message', msg)
})
server.on('error', console.error)
console.log('graygelf server listening on port %d bound to %s', server.port, server.address)
