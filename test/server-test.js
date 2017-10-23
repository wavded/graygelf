var test       = require('tape')
var os         = require('os')
var gelfserver = require('../server')
var graygelf   = require('../')

test('graygelf/server', function (t) {
  var serve = gelfserver()
  serve.listen()
  t.equal(serve.address, '0.0.0.0', 'default bind 0.0.0.0')
  t.equal(serve.port, 12201, 'default port 12201')
  serve.close()

  var serveopts = gelfserver()
  serveopts.listen(32323, '127.0.0.1').unref()
  t.equal(serveopts.address, '127.0.0.1', 'custom bind')
  t.equal(serveopts.port, 32323, 'custom port')

  t.throws(function () {
    serveopts.listen()
  }, 'throws on double bind')

  serveopts.close()
  t.end()
})

test('serve.on("error")', function (t) {
  var serve = gelfserver().listen()

  serve.on('error', function (er) {
    t.equal(er, 'oh no', 'called for udp errors')
    serve.close()
    t.end()
  })

  serve._udp.emit('error', 'oh no')
})

test('serve.on("message") (plain)', function (t) {
  var serve = gelfserver().listen()
  var log = graygelf()

  serve.once('message', function (gelf) {
    t.equal(gelf.short_message, 'my message', 'should include gelf message')
    serve.close()
    t.end()
  })

  log.emerg('my message')
})

test('serve.on("message") (deflate)', function (t) {
  var full_message = Array(8192/16).fill(' 123456789abcdef').join('')
  var serve = gelfserver().listen()
  var log = graygelf()

  serve.once('message', function (gelf) {
    t.equal(gelf.short_message, 'my message', 'should include gelf message')
    t.equal(gelf.full_message, full_message, 'should include gelf full message')
    serve.close()
    t.end()
  })

  // Force the message to be too big to fit as simple JSON
  // but not so large as to force splitting across multiple chunks
  var gelf = log._prepGelf(0, 'my message', full_message)
  log._send(gelf)
})

test('serve.on("message") (chunked)', function (t) {
  var serve = gelfserver().listen()
  var log = graygelf()

  log.chunkSize = 10
  serve.once('message', function (gelf) {
    t.equal(gelf.short_message, 'my message', 'includes short message')
    t.same(gelf.full_message, { addn2: 'more data' }, 'includes full message')
    t.equal(gelf._custom, 'field', 'includes custom field')
    serve.close()
    t.end()
  })

  log.emerg.a('my message', { addn2: 'more data' }, { custom: 'field' })
})

test('serve (expired chunks)', function (t) {
  var serve = gelfserver()
  serve.pendingChunks = {
    a: { data: Buffer('adfa'), lastReceived: Date.now() - 70000 },
    b: { data: Buffer('adfa'), lastReceived: Date.now() }
  }
  serve._checkExpired()
  t.ok(serve.pendingChunks.b, 'keeps new chunks < 60000')
  t.notOk(serve.pendingChunks.a, 'removes old chunks >= 60000')
  t.end()
})

test('serve.on("message") (chunked - out of order)', function (t) {
  var serve = gelfserver().listen()
  var log = graygelf()

  serve.once('message', function (gelf) {
    t.equal(gelf.version, '1.1', 'should have version: 1.1')
    t.equal(gelf.host, os.hostname(), 'should use os.hostname for host')
    t.equal(gelf.short_message, 'my message', 'should include short_message')
    t.equal(gelf.full_message.addn2, 'more data', 'should include full_message')
    t.equal(gelf.level, 0, 'should include level')
    t.ok(gelf.timestamp, 'should include UNIX timestamp')
    t.equal(gelf._more_extra, 'fields', 'should include _ fields')
    serve.close()
    t.end()
  })

  log.owrite = log.write
  log.chunkSize = 100

  var expectedChunks = 2
  var chunks = []

  log.write = function (chunk) {
    chunks.push(chunk)
    if (!--expectedChunks) {
      log.owrite(chunks[1])
      setTimeout(function () {
        log.owrite(chunks[0])
      }, 500)
    }
  }

  log.panic.a('my message', { addn2: 'more data' }, { more_extra: 'fields' })
})

test('serve.on("message") gzip', function (t) {
  var serve = gelfserver().listen()
  var log = graygelf({ compressType: 'gzip' })

  serve.once('message', function (gelf) {
    t.equal(gelf.short_message, 'my message', 'should include gelf message')
    serve.close()
    t.end()
  })

  log.emerg('my message')
})

test('serve.pipe(log)', function (t) {
  var server1 = gelfserver().listen(12203)
  var client1 = graygelf({ port: 12203 })
  var server2 = gelfserver().listen(12204)
  var client2 = graygelf({ port: 12204 })

  server1.pipe(client2)

  server2.once('message', function (gelf) {
    t.equal(gelf.short_message, 'my proxied message', 'should proxy gelf')
    server1.close()
    server2.close()
    t.end()
  })
  client1.emerg('my proxied message')
})
