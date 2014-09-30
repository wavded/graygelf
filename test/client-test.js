var test = require('tape')
var os = require('os')
var graygelf = require('../')

test('defaults', function (t) {
  var gg = graygelf()
  t.equal(gg.graylogHost, 'localhost')
  t.equal(gg.graylogPort, 12201)
  t.equal(gg.facility, undefined)
  t.equal(gg.compressType, 'deflate')
  t.equal(gg.chunkSize, 1240)
  t.end()
})

test('mocking', function (t) {
  var gg = graygelf({ mock: true })
  t.ok(!gg._udp, 'does not setup a udp client')
  t.end()
})

test('emits messages', function (t) {
  t.plan(1)
  var gg = graygelf()
  gg.once('message', function (data) {
    t.equal(0, data.level, 0)
  })
  gg.emerg('oh', 'no')
})

test('setups per level', function (t) {
  var gg = graygelf()
  Object.keys(graygelf.LOG_LEVELS).forEach(function (level) {
    t.equal(typeof gg[level], 'function', level)
    t.ok(gg.stream[level].writable, level+' writable')
    t.equal(typeof gg.stream[level].write, 'function', level+' write function')
    t.equal(typeof gg.stream[level].end, 'function', level+' end function')
  })
  t.end()
})

test('gelf messages', function (t) {
  var gg = graygelf({
    host: 'graylog.test.local',
    port: 32323,
    facility: 'test_facility'
  })

  gg.once('message', function (gelf) {
    t.equal(gelf.version, '1.1', 'should have version: 1.1')
    t.equal(gelf.host, os.hostname(), 'should use os.hostname for host')
    t.equal(gelf.short_message, 'my message', 'should include short_message')
    t.equal(gelf.full_message.addn, 'data', 'should include full_message')
    t.equal(gelf.level, 0, 'should include level')
    t.equal(gelf.facility, 'test_facility', 'should include facility')
    t.ok(gelf.timestamp, 'should include UNIX timestamp')
    t.equal(gelf._extra, 'field', 'should include _ fields')
    t.ok(!gelf._id, 'should not include _id field')
  })
  gg.emerg.a('my message', { addn: 'data', _extra: 'field', _id: '2323232323' })



  // gelf = gg._prepJSON(0, { 'an': 'object' }, [ 'data', 'field', '2323232323' ])

  // t.equal(gelf.short_message.an, 'object', 'should include short message as an object')
  // t.ok(Array.isArray(gelf.full_message), 'should include a full message as an array')

  // gelf = gg._prepJSON(0, 'string1', 'string2')
  // t.equal(gelf.full_message, 'string2', 'should include full message as a string')

  // gelf = gg._prepJSON(0, 'a', 'b', 'c', 'd', 'full' )
  // t.equal(gelf.full_message, 'full', 'full message should be last argument')
  // t.equal(gelf.short_message, 'a b c d', 'concats prev arguments akin to console.log')
  t.end()
})

// suite('gelf messages', function () {
//   })

//   test('supports binary message input', function () {
//     var gelf = gg._prepJson(0, new Buffer('some characters'))
//     assert.equal(gelf.short_message, 'some characters', 'should include short_message')
//   })

//   test('compresses gelf message properly', function (next) {
//     var gelf = gg._prepJson(0, 'my message', { addn: 'data', _extra: 'field', _id: '2323232323' })

//     gg._compress(gelf, function (chunk) {
//       assert(Buffer.isBuffer(chunk), 'should be a buffer')
//       assert.equal(chunk[0], 0x78, 'should include deflate header')
//       next()
//     })
//   })

//   test('handles chunked gelf messages properly', function (next) {
//     var gelf = gg._prepJson(0, 'my message', { addn: 'data', _extra: 'field', _id: '2323232323' })
//     gg.chunkSize = 100
//     var index = 0
//     var expectedChunks = 2

//     gg._compress(gelf, function (chunk) {
//       assert(Buffer.isBuffer(chunk), 'should be a buffer')
//       assert.equal(chunk[0], 0x1e, 'should include chunk header')
//       assert.equal(chunk[10], index++, 'should have index number')
//       assert.equal(chunk[11], expectedChunks, 'should have total number')
//       if (index == expectedChunks) next()
//     })
//   })
// })

// suite('gzip compression', function () {
//   var gg = graygelf.createClient({ host: 'graylog.test.local', port: 32323, facility: 'test_facility', compressType: 'gzip' })

//   test('compresses gelf message properly', function (next) {
//     var gelf = gg._prepJson(0, 'my message', { addn: 'data', _extra: 'field', _id: '2323232323' })

//     gg._compress(gelf, function (chunk) {
//       assert(Buffer.isBuffer(chunk), 'should be a buffer')
//       assert.equal(chunk[0], 0x1f, 'should include gzip header')
//       next()
//     })
//   })
// })

// suite('error messages', function () {
//   var gg = graygelf.createClient({ host: 'graylog.adc4gis.local', port: 1223232 })

//   test('emit errors on udp messages', function () {
//     var err = 'oh no';
//     gg.once('error', function (msg) { assert.equal(msg, err) })
//     gg._checkError(err)
//   })

//   test('emits errors from udp', function (done) {
//     gg.once('error', function (e) {
//       assert.equal(e.message, 'cause a failure')
//       done()
//     })
//     gg._udp.emit('error',new Error('cause a failure'))
//   })
// })
