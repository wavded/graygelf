"use strict";
var timestamp
try {
  timestamp = require('microtime').nowDouble
}
catch (e) {
  timestamp = function () { return Date.now() / 1000 >> 0 }
}

var LOG_LEVELS = ['emerg','alert','crit','error','warn','notice','info','debug']
var LOG_LEVEL_PRIORITIES = Object.create(null)
LOG_LEVELS.forEach(function (level, priority) { LOG_LEVEL_PRIORITIES[level] = priority })

var zlib = require('zlib')
var dgram = require('dgram')
var os = require('os')
var crypto = require('crypto')
var Stream = require('stream')

var GrayGelf = function (opts) {
  opts || (opts = {})
  this.graylogHost = opts.host || 'localhost'
  this.graylogPort = opts.port || 12201
  this.facility = opts.facility
  this.chunkSize = opts.chunkSize || GrayGelf.CHUNK_WAN
  this.compressType = (opts.compressType || '') === 'gzip' ? 'gzip' : 'deflate'
  this.hostname = os.hostname()

  if (!opts.mock) {
    this._udp = dgram.createSocket('udp4')
    this._udp.on('error', this._checkError.bind(this))
  }

  this.writable = true // writable stream
  this.stream = {}

  LOG_LEVELS.forEach(function (name, level) {
    this[name] = function () { this.log.apply(this, [level].concat(Array.prototype.slice.call(arguments))); return this }.bind(this)
  }, this)
  LOG_LEVELS.forEach(this._stream, this)
}
GrayGelf.prototype = Object.create(Stream.prototype)
GrayGelf.prototype.write = function (chunk) {
  if (!this._udp) return
  this._udp.send(chunk, 0, chunk.length, this.graylogPort, this.graylogHost)
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
  if (!this._udp) return
  this._udp.close()
  this._udp = null
}

GrayGelf.prototype._prepJson = function ( /*level, short, full*/ ) {
  if (!arguments.length) return; // bail, nothing to log

  var level, short, full, args
  if (arguments.length <= 3) {
    level = arguments[0]
    short = arguments[1]
    full = arguments[2]
  } else {
    args = Array.prototype.slice.call(arguments)
    level = args.shift()
    full = args.pop()
    short = args.join(' ')
  }

  if (typeof level === 'string') {
    if (typeof LOG_LEVEL_PRIORITIES[level] === 'undefined') {
      throw new Error('invalid level ' + level)
    }

    level = LOG_LEVEL_PRIORITIES[level]
  }

  this.emit('message', LOG_LEVELS[level], short, full)

  var gelf = {
    version: '1.1',
    host: this.hostname,
    short_message: Buffer.isBuffer(short) ? short.toString() : short,
    timestamp: timestamp(),
    level: level
  }

  if (this.facility) gelf.facility = this.facility

  if (full) {
    gelf.full_message = Buffer.isBuffer(full) ? full.toString() : full

    if (typeof full == 'object' && !Array.isArray(full) && full !== null) {
      for (var key in full) {
        if (full.hasOwnProperty(key)) {
          // populate special _ fields, _id not allowed in GELF format
          if (key.charAt(0) == '_' && key != '_id') gelf[key] = full[key]
        }
      }
    }
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

      crypto.randomBytes(6, function (er, idBuf) {
        if (er) return this.emit('error', er)

        for (var i = 0; i < total; i++) {
          var bytesToSend = offset + this.chunkSize < message.length ? this.chunkSize : message.length - offset
          var chunk = new Buffer(bytesToSend + 12)
          chunk[0] = 0x1e
          chunk[1] = 0x0f
          idBuf.copy(chunk, 2, 0, 6)
          chunk[10] = i
          chunk[11] = total

          message.copy(chunk, 12, offset, offset+bytesToSend)
          offset += bytesToSend
          next.call(this, chunk)
        }
      }.bind(this))
    }
    else next.call(this, message)
  }.bind(this))
}

GrayGelf.prototype.log = function () {
  var gelf = this._prepJson.apply(this, arguments)
  this._compress(gelf, this.write)
  return this
}

GrayGelf.CHUNK_WAN = 1240
GrayGelf.CHUNK_LAN = 8154

module.exports = GrayGelf
