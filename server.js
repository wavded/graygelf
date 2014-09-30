var zlib   = require('zlib')
var dgram  = require('dgram')
var Stream = require('stream')

var GrayGelfServer = function () {
  if (!(this instanceof GrayGelfServer)) {
    return new GrayGelfServer()
  }

  this.pendingChunks = Object.create(null)
  this.readable      = true
}
GrayGelfServer.prototype = Object.create(Stream.prototype)

GrayGelfServer.prototype._checkError = function (er) { this.emit('error', er) }

GrayGelfServer.prototype.listen = function (port, address) {
  if (this._udp) throw new Error('GrayGelf is already listening on a port')

  this.port = port || 12201
  this.address = address || '0.0.0.0'

  this._udp = dgram.createSocket('udp4')
  this._udp.on('error', this._checkError.bind(this))
  this._udp.on('message', this._message.bind(this))
  this._udp.bind(this.port, this.address)

  // clean incomplete chunked messages
  this._chunkInterval = setInterval(this._checkExpired.bind(this), 60000)
  return this
}

GrayGelfServer.prototype.unref = function () {
  this._udp.unref()
  this._chunkInterval.unref()
  return this
}

GrayGelfServer.prototype.close = function () {
  this._udp.close()
  this._udp = null
  clearInterval(this._chunkInterval)
}

GrayGelfServer.prototype._checkExpired = function () {
  var now = Date.now()
  for (var id in this.pendingChunks)
    if (now - this.pendingChunks[id].lastReceived >= 60000)
      delete this.pendingChunks[id]
}

GrayGelfServer.prototype._handleChunk = function (chunk) {
  var id = chunk.toString('ascii', 2, 8)
  var index = chunk[10]
  var total = chunk[11]

  var chunks = this.pendingChunks[id] || { data: [] }
  chunks.data[index] = chunk.slice(12) // store without chunk header
  chunks.lastReceived = Date.now()

  this.pendingChunks[id] = chunks

  if (chunks.data.length === total) { // last index has been filled
    while (total--) if (!Buffer.isBuffer(chunks.data[total])) return // make sure the array is filled
    this._message(Buffer.concat(chunks.data)) // create complete buffer
    delete this.pendingChunks[id]
  }
}

GrayGelfServer.prototype._message = function (buf, details) {
  if (details) this.emit('data', buf) // from udp.on('message')

  switch (buf[0]) {
    case 0x78: // zlib (deflate) message
      zlib.inflate(buf, this._broadcast.bind(this))
      break
    case 0x1f: // gzip message
      zlib.gunzip(buf, this._broadcast.bind(this))
      break
    case 0x1e: // chunked message
      this._handleChunk(buf)
      break
    default:   // unknown message
  }
}

GrayGelfServer.prototype._broadcast = function (er, buf) {
  /* istanbul ignore next */
  if (er) return this.emit('error', er)

  var data = JSON.parse(buf.toString())
  this.emit('message', data)
}

module.exports = GrayGelfServer
