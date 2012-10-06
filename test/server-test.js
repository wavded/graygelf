var assert = require('assert')
var os = require('os')
var graygelf = require('../')

suite('general', function () {
  test('exports a single function', function () {
    assert.equal(typeof graygelf.createServer, 'function')
  })

  test('defaults to port 12201 and binds to address 0.0.0.0', function () {
    var gg = graygelf.createServer().listen()
    assert.equal(gg.address, '0.0.0.0')
    assert.equal(gg.port, 12201)
    gg.close()
  })

  test('accepts port and address', function () {
    var gg = graygelf.createServer().listen(32323, '127.0.0.1')
    assert.equal(gg.address, '127.0.0.1')
    assert.equal(gg.port, 32323)
    gg.close()
  })
})

suite('deflate compress type', function () {
  var server = graygelf.createServer().listen(12201)
  var client = graygelf.createClient({ facility: 'test_facility' })

  test('handles gelf messages', function (done) {
    server.once('message', function (gelf) {
      assert.equal(gelf.version, '1.0', 'should have version: 1.0')
      assert.equal(gelf.host, os.hostname(), 'should use os.hostname for host')
      assert.equal(gelf.short_message, 'my message', 'should include short_message')
      assert.equal(gelf.full_message.addn, 'data', 'should include full_message')
      assert.equal(gelf.level, 0, 'should include level')
      assert.equal(gelf.facility, 'test_facility', 'should include facility')
      assert(gelf.timestamp, 'should include UNIX timestamp')
      assert.equal(gelf._extra, 'field', 'should include _ fields')
      assert(!gelf._id, 'should not include _id field')
      done()
    })
    client.emerg('my message', { addn: 'data', _extra: 'field', _id: '2323232323' })
  })

  test('handles chunked messages', function (done) {
    client.chunkSize = 10
    server.once('message', function (gelf) {
      assert.equal(gelf.version, '1.0', 'should have version: 1.0')
      assert.equal(gelf.host, os.hostname(), 'should use os.hostname for host')
      assert.equal(gelf.short_message, 'my message', 'should include short_message')
      assert.equal(gelf.full_message.addn2, 'more data', 'should include full_message')
      assert.equal(gelf.level, 0, 'should include level')
      assert.equal(gelf.facility, 'test_facility', 'should include facility')
      assert(gelf.timestamp, 'should include UNIX timestamp')
      assert.equal(gelf._more_extra, 'fields', 'should include _ fields')
      assert(!gelf._id, 'should not include _id field')
      done()
    })
    client.emerg('my message', { addn2: 'more data', _more_extra: 'fields', _id: '2323232323' })
  })
})

suite('gzip compress type', function () {
  var server = graygelf.createServer().listen(12202)
  var client = graygelf.createClient({ port: 12202, facility: 'test_facility', compressType: 'gzip' })

  test('handles gelf messages', function (done) {
    server.once('message', function (gelf) {
      assert.equal(gelf.version, '1.0', 'should have version: 1.0')
      assert.equal(gelf.host, os.hostname(), 'should use os.hostname for host')
      assert.equal(gelf.short_message, 'my message', 'should include short_message')
      assert.equal(gelf.full_message.addn2, 'more data', 'should include full_message')
      assert.equal(gelf.level, 0, 'should include level')
      assert.equal(gelf.facility, 'test_facility', 'should include facility')
      assert(gelf.timestamp, 'should include UNIX timestamp')
      assert.equal(gelf._more_extra, 'fields', 'should include _ fields')
      assert(!gelf._id, 'should not include _id field')
      done()
    })
    client.emerg('my message', { addn2: 'more data', _more_extra: 'fields', _id: '2323232323' })
  })

  test('handles chunked messages', function (done) {
    client.chunkSize = 10
    server.once('message', function (gelf) {
      assert.equal(gelf.version, '1.0', 'should have version: 1.0')
      assert.equal(gelf.host, os.hostname(), 'should use os.hostname for host')
      assert.equal(gelf.short_message, 'my message', 'should include short_message')
      assert.equal(gelf.full_message.addn2, 'more data', 'should include full_message')
      assert.equal(gelf.level, 0, 'should include level')
      assert.equal(gelf.facility, 'test_facility', 'should include facility')
      assert(gelf.timestamp, 'should include UNIX timestamp')
      assert.equal(gelf._more_extra, 'fields', 'should include _ fields')
      assert(!gelf._id, 'should not include _id field')
      done()
    })
    client.emerg('my message', { addn2: 'more data', _more_extra: 'fields', _id: '2323232323' })
  })
})
