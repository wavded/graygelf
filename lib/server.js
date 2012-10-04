"use strict"
var zlib = require('zlib')
var dgram = require('dgram')
var EventEmitter = require('events').EventEmitter

var GrayGelfServer = function (cb) {
  this.callback = cb || null
  this.pendingChunks = Object.create(null)
}
GrayGelfServer.prototype = Object.create(EventEmitter.prototype)
GrayGelfServer.prototype._checkError = function (er) { if (er) this.emit('error', er) }

GrayGelfServer.prototype.listen = function (port, address) {
  if (this._listening) throw new Error('GrayGelf is already listening on a port')
  this.port = port || 12201
  this.address = address || '0.0.0.0'

  this.udp = dgram.createSocket('udp4')
  this.udp.on('error', this._checkError.bind(this))
  this.udp.on('message', this._message.bind(this))
  this.udp.bind(this.port, this.address)
  this._listening = true
  setInterval(this._checkExpired.bind(this), 60000) // clean incomplete chunked messages
  return this
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

  var chunks = this.pendingChunks[id] || []
  chunks[index] = chunk.slice(12) // store without chunk header
  chunks.lastReceived = Date.now()

  this.pendingChunks[id] = chunks

  if (chunks.length === total) { // last index has been filled
    while (--total) if (!Buffer.isBuffer(chunks[total])) return // make sure the array is filled
    this._message(Buffer.concat(chunks)) // create complete buffer
    delete this.pendingChunks[id]
  }
}

GrayGelfServer.prototype._message = function (buf) {
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
  if (er) return this.emit('error', er)

  var data = JSON.parse(buf.toString())
  if (this.callback) this.callback(data)
  this.emit('message', data)
}

module.exports = GrayGelfServer
