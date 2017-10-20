var test     = require('tape')
var os       = require('os')
var graygelf = require('../')
var fs       = require('fs')
var join     = require('path').join

test('graygelf', function (t) {
  var log = graygelf() // defaults
  t.equal(log.graylogHost, 'localhost')
  t.equal(log.graylogPort, 12201)
  t.equal(log.compressType, 'deflate')
  t.equal(log.chunkSize, 1240)
  t.ok(log._udp, 'set up a udp client')

  var loghost = graygelf('a.server.yo')
  t.equal(loghost.graylogHost, 'a.server.yo')

  var logopts = graygelf({
    host: 'word',
    port: 23232,
    compressType: 'gzip',
    chunkSize: 10
  })
  t.equal(logopts.graylogHost, 'word')
  t.equal(logopts.graylogPort, 23232)
  t.equal(logopts.compressType, 'gzip')
  t.equal(logopts.chunkSize, 10)

  var logmock = graygelf({ mock: true })
  t.ok(!logmock._udp, 'does not set up a udp client')
  logmock.write('blah blah') // will throw if fails
  t.pass('write does nothing when mocking')
  t.end()
})

test('log.on("message")', function (t) {
  t.plan(5)
  var log = graygelf()
  log.once('message', function (data) {
    t.equal(data.level, 0, 'stores level')
    t.ok(data.timestamp, 0, 'stores timestamp')
    t.ok(data.version, '1.1', 'sets version')
    t.equal(data.host, os.hostname(), 'sets host')
    t.equal(data.short_message, 'oh no', 'sets short_message')
  })
  log.emerg('oh', 'no')
})

test('log.on("error")', function (t) {
  t.plan(1)
  var log = graygelf()
  log.once('error', function (er) {
    t.equal(er, 'oh no', 'will emit errors emitted by udp client')
  })
  log._udp.emit('error', 'oh no')
})

test('log.fields', function (t) {
  var log = graygelf(), gelf
  log.fields.facility = 'test'

  gelf = log.info('test')
  t.equal(gelf._facility, 'test', 'includes global custom fields')

  gelf = log.info.a('test', 'full', { facility: 'testa', row: 32 })
  t.equal(gelf._row, 32, 'includes local custom fields')
  t.equal(gelf._facility, 'testa', 'local custom fields override global')
  t.end()
})

test('log[level]', function (t) {
  var log = graygelf(), gelf
  Object.keys(graygelf.LOG_LEVELS).forEach(function (level) {
    t.equal(typeof log[level], 'function', 'has '+level)
  })
  gelf = log.info('hello', 'world')
  t.equal(gelf.short_message, 'hello world', 'console concat')
  t.equal(gelf.level, 6, 'sets level 6')

  gelf = log.error('hello %s', 'world')
  t.equal(gelf.short_message, 'hello world', 'console printf')
  t.equal(gelf.level, 3, 'sets level 3')

  var er = new Error('oh no')
  gelf = log.crit(er)
  t.equal(gelf.short_message, 'oh no', 'stores er.message as short_message')
  t.equal(gelf.level, 2, 'sets level 2')
  t.ok(/client-test.js/.test(gelf.full_message), 'stores stack a full_message')

  log.once('message', function (gelf) {
    t.equal(gelf.short_message, 'oh no', 'alternate context')
    t.ok(/client-test.js/.test(gelf.full_message), 'handles error case')
    t.end()
  })
  var ee = new(require('events').EventEmitter)()
  ee.on('error', log.crit)
  ee.emit('error', new Error('oh no'))
})

test('log[level].a', function (t) {
  var log = graygelf(), gelf
  Object.keys(graygelf.LOG_LEVELS).forEach(function (level) {
    t.equal(typeof log[level].a, 'function', 'has '+level+'.a')
  })
  gelf = log.info.a('hello world', 'a long message', { custom: 'field' })
  t.equal(gelf.short_message, 'hello world', 'stores short_message')
  t.equal(gelf.full_message, 'a long message', 'stores full_message')
  t.equal(gelf._custom, 'field', 'stores custom fields')

  t.end()
})

test('log.stream', function (t) {
  var log = graygelf()
  t.plan(5)

  t.throws(function () {
    log.stream('wfasdfas')
  }, 'throws if invalid stream name')

  var rstream = fs.createReadStream(join(__dirname,'stream.txt'))
  var data = [
    'A line',
    'A second line'
  ]

  log.on('message', function (gelf) {
    t.equal(gelf.level, 6, 'level 6')
    t.equal(gelf.short_message, data.shift(), 'lined data')
  })

  rstream.pipe(log.stream('info'))
})

test('log.raw', function (t) {
  var log = graygelf(), gelf
  gelf = log.raw({
    level: 0,
    short_message: 'a short message',
    _custom: 'field'
  })

  t.equal(gelf._custom, 'field', 'includes provided data')
  t.equal(gelf.version, '1.1', 'sets version if absent')
  t.equal(gelf.host, os.hostname(), 'sets host if absent')
  t.ok(gelf.timestamp, 'sets timestamp if absent')

  gelf = log.raw({
    version: '1.0',
    host: 'ahost',
    timestamp: 100
  })
  t.equal(gelf.version, '1.0', 'uses version if present')
  t.equal(gelf.host, 'ahost', 'uses host if present')
  t.equal(gelf.timestamp, 100, 'uses timestamp if present')

  t.end()
})

test('log._send (plain json)', function (t) {
  t.plan(2)
  var log = graygelf()

  // overwrite for testing
  log.write = function (chunk) {
    t.ok(Buffer.isBuffer(chunk), 'should be a buffer')
    t.equal(chunk[0], 0x7b, 'should fit within a single chunk as plain JSON')
  }

  var gelf = log._prepGelf(0, 'my message')
  log._send(gelf)
})

test('log._send (deflate)', function (t) {
  t.plan(2)
  var log = graygelf()

  // overwrite for testing
  log.write = function (chunk) {
    t.ok(Buffer.isBuffer(chunk), 'should be a buffer')
    t.equal(chunk[0], 0x78, 'should include deflate header')
  }

  // Force the message to be too big to fit as simple JSON
  // but not so large as to force splitting across multiple chunks
  var full_message = Array(8192/16).fill(' 123456789abcdef').join('')
  var gelf = log._prepGelf(0, 'my message', full_message)
  log._send(gelf)
})

test('log._send (chunked)', function (t) {
  var log = graygelf()
  log.chunkSize = 100

  var expectedChunks = 2
  var index = 0

  // overwrite for testing
  log.write = function (chunk) {
    t.ok(Buffer.isBuffer(chunk), 'should be a buffer')
    t.equal(chunk[0], 0x1e, 'should include chunk header')
    t.equal(chunk[10], index++, 'should have index number')
    t.equal(chunk[11], expectedChunks, 'should have total number')
    if (index === expectedChunks) t.end()
  }

  var gelf = log._prepGelf(0, 'my message', 'full message', { extra: 'field' })
  log._send(gelf)
})
