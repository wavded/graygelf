"use strict"
var RAND_SEED = Date.now()
var LOG_LEVELS = ['emerg','alert','crit','error','warn','notice','info','debug']

var zlib = require('zlib')
var dgram = require('dgram')
var os = require('os')
var Stream = require('stream')

var GrayGelf = function (opts) {
  opts || (opts = {})
  this.graylogHost = opts.host || 'localhost'
  this.graylogPort = opts.port || 12201
  this.facility = opts.facility || 'GELF'
  this.chunkSize = opts.chunkSize || GrayGelf.CHUNK_WAN
  this.compressType = (opts.compressType || '') === 'gzip' ? 'gzip' : 'deflate'
  this._udp = dgram.createSocket('udp4')

  this.writable = true // writable stream
  this.stream = {}
  LOG_LEVELS.forEach(this._stream, this)
}
GrayGelf.prototype = Object.create(Stream.prototype)
GrayGelf.prototype.write = function (chunk) {
  this._udp.send(chunk, 0, chunk.length, this.graylogPort, this.graylogHost, this._checkError.bind(this))
}

GrayGelf.prototype._checkError = function (er) { if (er) this.emit('error', er) }

GrayGelf.prototype._stream = function (name) {
  var stream = new Stream()
  stream.writable = true
  stream.write = this[name].bind(this)
  stream.end = function(){} // 'end' event is noop, stream always stays open
  this.stream[name] = stream
}

GrayGelf.prototype.close = function () {
  this._udp.close()
  this._udp = null
}

GrayGelf.prototype._prepJson = function (level, msg, addn) {
  if (!arguments.length) return; // bail, nothing to log
  var gelf = {
    version: '1.0',
    host: os.hostname(),
    short_message: Buffer.isBuffer(msg) ? msg.toString() : msg,
    full_message: Buffer.isBuffer(addn) ? addn.toString() : addn,
    timestamp: Date.now() / 1000 >> 0,
    level: level,
    facility: this.facility
  }
  for (var key in addn) {
    // populate special _ fields, _id not allowed in GELF format
    if (key.charAt(0) == '_' && key != '_id') gelf[key] = addn[key]
  }
  return gelf
}

GrayGelf.prototype._compress = function (gelf, next) {
  var gelfbuf = new Buffer(JSON.stringify(gelf))
  zlib[this.compressType](gelfbuf, function (er, message) {
    if (er) return this.emit('error', er)

    if (message.length > this.chunkSize) {
      var total = Math.ceil(message.length / this.chunkSize)
      var offset = 0
      var id = RAND_SEED+'graylog' // at least 8 bytes worth
      RAND_SEED++

      for (var i = 0; i < total; i++) {
        var bytesToSend = offset + this.chunkSize < message.length ? this.chunkSize : message.length - offset
        var chunk = new Buffer(bytesToSend + 12)
        chunk[0] = 0x1e
        chunk[1] = 0x0f
        chunk.write(id, 2, 8, 'ascii') // truncate any extra bytes
        chunk[10] = i
        chunk[11] = total

        message.copy(chunk, 12, offset, offset+bytesToSend)
        offset += bytesToSend
        next.call(this, chunk)
      }
    }
    else next.call(this, message)
  }.bind(this))
}

LOG_LEVELS.forEach(function (name, level) {
  GrayGelf.prototype[name] = function (msg, addn) {
    var gelf = this._prepJson(level, msg, addn)
    this._compress(gelf, this.write)
  }
})

GrayGelf.CHUNK_WAN = 1240
GrayGelf.CHUNK_LAN = 8154

module.exports = GrayGelf
