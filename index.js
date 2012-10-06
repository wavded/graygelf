var GrayGelf = require('./lib/client')
var GrayGelfServer = require('./lib/server')

// Node Core style exports
exports.Client = GrayGelf
exports.Server = GrayGelfServer
exports.createClient = function (opts) { return new GrayGelf(opts) }
exports.createServer = function (fn) { return new GrayGelfServer(fn) }
