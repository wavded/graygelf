var zlib   = require('zlib')
var dgram  = require('dgram')
var os     = require('os')
var crypto = require('crypto')
var Stream = require('stream')
var format = require('util').format
var split  = require('split')

var isPlainObject = require('lodash.isplainobject')

/**
 * Prefer microtime accuracy but fallback if unable to use
 */
var timestamp
try       { timestamp = require('microtime').nowDouble }
catch (e) { timestamp = function () { return Date.now() / 1000 >> 0 } }

/**
 * Available logging levels
 * @type {Array}
 */
var LOG_LEVELS = {
  'emerg'   : 0,
  'panic'   : 0,
  'alert'   : 1,
  'crit'    : 2,
  'error'   : 3,
  'err'     : 3,
  'warn'    : 4,
  'warning' : 4,
  'notice'  : 5,
  'info'    : 6,
  'debug'   : 7
}

var GrayGelf = function (opts) {
  if (!(this instanceof GrayGelf)) {
    return new GrayGelf(opts)
  }

  if (typeof opts === 'string') opts = { host: opts }
  if (!opts) opts = {}

  this.graylogHost  = opts.host || 'localhost'
  this.graylogPort  = opts.port || 12201
  this.fields       = {}

  this.chunkSize    = opts.chunkSize || GrayGelf.CHUNK_WAN
  this.compressType = (opts.compressType || '') === 'gzip' ? 'gzip' : 'deflate'
  this.hostname     = os.hostname()

  if (!opts.mock) {
    this._udp = dgram.createSocket('udp4')
    this._udp.on('error', this._checkError.bind(this))
    this._udp.unref()
  }

  this.writable = true // writable stream
}

GrayGelf.prototype = Object.create(Stream.prototype)

GrayGelf.prototype.write = function (chunk) {
  if (!this._udp) return
  this._udp.send(chunk, 0, chunk.length, this.graylogPort, this.graylogHost)
}

GrayGelf.prototype._checkError = function (er) { if (er) this.emit('error', er) }

GrayGelf.prototype._prepGelf = function (level, message, attachment) {
  var gelf = {
    version: '1.1',
    host: this.hostname,
    short_message: message,
    timestamp: timestamp(),
    level: level
  }

  if (this.facility) gelf.facility = this.facility
  if (attachment) gelf.full_message = attachment


  this.emit('message', gelf)
  return gelf
}

GrayGelf.prototype._attach = function (gelf, attachment) {
  gelf.full_message = attachment

  if (isPlainObject(attachment)) {
    for (var key in attachment) {
      if (attachment.hasOwnProperty(key)) {
        // populate special _ fields, _id not allowed in GELF format
        if (key.charAt(0) === '_' && key !== '_id') gelf[key] = attachment[key]
      }
    }
  }
}

GrayGelf.prototype._send = function (gelf) {
  var gelfbuf = new Buffer(JSON.stringify(gelf))
  var graygelf = this

  zlib[this.compressType](gelfbuf, function (er, message) {
    if (er) return graygelf.emit('error', er)

    if (message.length > this.chunkSize) {
      var total = Math.ceil(message.length / this.chunkSize)
      var offset = 0

      crypto.randomBytes(6, function (er, idBuf) {
        if (er) return graygelf.emit('error', er)

        for (var i = 0; i < total; i++) {
          var bytesToSend = offset + graygelf.chunkSize < message.length ? graygelf.chunkSize : message.length - offset
          var chunk = new Buffer(bytesToSend + 12)
          chunk[0] = 0x1e
          chunk[1] = 0x0f
          idBuf.copy(chunk, 2, 0, 6)
          chunk[10] = i
          chunk[11] = total

          message.copy(chunk, 12, offset, offset+bytesToSend)
          offset += bytesToSend
          graygelf.write(chunk)
        }
      })
    }
    else graygelf.write(message)
  })
}

GrayGelf.prototype.stream = function (name) {
  if (!(name in LOG_LEVELS)) throw new Error('invalid stream name')
  var stream = new Stream()
  var lines = split()
  stream.writable = true
  stream.write = this[name].bind(this)
  stream.end = function(){} // 'end' event is noop, stream always stays open
  lines.pipe(stream)
  return lines
}

GrayGelf.prototype.raw = function (raw) {
  this._send(raw)
}

Object.keys(LOG_LEVELS).forEach(function (name) {
  var level = LOG_LEVELS[name]

  GrayGelf.prototype[name] = function () {
    var graygelf = this
    var message = format.apply(null, arguments)
    var gelf = this._prepGelf(level, message)
    setImmediate(this._send.bind(this), gelf)

    return {
      attach: function (attachment) {
        graygelf._attach(gelf, attachment)
      }
    }
  }
})

GrayGelf.CHUNK_WAN  = 1240
GrayGelf.CHUNK_LAN  = 8154
GrayGelf.LOG_LEVELS = LOG_LEVELS

module.exports = GrayGelf