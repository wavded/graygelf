var assert = require('assert')
var os = require('os')
var graygelf = require('../')

suite('general', function () {
  test('exports a single function', function () {
    assert.equal(typeof graygelf.server, 'function')
  })

  test('defaults to port 12201 and binds to address 0.0.0.0', function () {
    var gg = graygelf.server()
    assert.equal(gg.address, '0.0.0.0')
    assert.equal(gg.port, 12201)
  })

  test('accepts port and address', function () {
    var gg = graygelf.server({ port: 32323, address: '127.0.0.1' })
    assert.equal(gg.address, '127.0.0.1')
    assert.equal(gg.port, 32323)
  })
})