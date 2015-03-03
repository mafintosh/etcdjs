var request = require('request')
var roundround = require('roundround')

var noop = function () {}

var Stats = function (client) {
  this._client = client
}

Stats.prototype.self = function (machine, cb) {
  if (typeof machine === 'function') return this.self(null, machine)
  this._client._request({uri: (machine || '') + '/v2/stats/self', json: true}, cb)
}

Stats.prototype.store = function (cb) {
  this._client._request({uri: '/v2/stats/store', json: true}, cb)
}

Stats.prototype.leader = function (cb) {
  this._client._request({uri: '/v2/stats/leader', json: true}, cb)
}

var normalizeUrl = function (url) {
  url = url.indexOf('://') === -1 ? 'http://' + url : url
  url = url.replace(/\/$/, '')
  if (!/:\d+/.test(url)) url += ':4001'
  return url
}

var Client = function (host, opts) {
  if (!(this instanceof Client)) return new Client(host, opts)

  if (typeof host === 'object' && host && !Array.isArray(host)) { // overloaded - this is probably a bad idea
    opts = host
    host = null
  }

  if (!opts) opts = {}

  var disc = opts.token || /^https:\/\/discovery.etcd.io\//.test(host || '')

  this._discovery = disc ? opts.token || host : null

  if (disc) this._hosts = []
  else this._hosts = [].concat(host || opts.host || opts.hosts || '127.0.0.1').map(normalizeUrl)

  this._prev = this._hosts.join(',')
  this._json = opts.json || false
  this._timeout = opts.timeout || 60 * 1000
  this._next = roundround(this._hosts)
  this._refresh = opts.refresh || false
  this._requests = []
  this._interval = null
  this._destroyed = false
  this._wait = null

  this.stats = new Stats(this)
  if (this._refresh) this.autoRefresh()
}

Client.prototype.autoRefresh = function () {
  if (this._interval) clearInterval(this._interval)
  this._refresh = true
  this._interval = setInterval(this.machines.bind(this, noop), 30 * 1000)
  if (this._interval.unref) this._interval.unref()
}

Client.prototype.set = function (key, value, opts, cb) {
  if (typeof opts === 'function') return this.set(key, value, null, opts)
  if (!opts) opts = {}
  if (!cb) cb = noop
  if (this._json) value = JSON.stringify(value)

  var form = {}

  if (value) form.value = value
  if (opts.ttl) form.ttl = '' + opts.ttl
  if (opts.dir) form.dir = 'true'

  if (opts.prevExist !== undefined) form.prevExist = '' + opts.prevExist
  if (opts.prevValue !== undefined) form.prevValue = this._json ? JSON.stringify(opts.prevValue) : '' + opts.prevValue
  if (opts.prevIndex !== undefined) form.prevIndex = '' + opts.prevIndex

  this._request({
    method: 'PUT',
    uri: this._key(key),
    form: form,
    json: true
  }, cb)
}

Client.prototype.update = function (key, value, opts, cb) {
  if (typeof opts === 'function') return this.update(key, value, null, opts)
  if (!opts) opts = {}
  opts.prevExist = true
  this.set(key, value, opts, cb)
}

Client.prototype.get = function (key, opts, cb) {
  if (typeof key === 'function') return this.get('', null, key)
  if (typeof opts === 'function') return this.get(key, null, opts)
  if (!opts) opts = {}

  var qs = {}
  if (opts.wait) qs.wait = 'true'
  if (opts.waitIndex !== undefined) qs.waitIndex = '' + opts.waitIndex
  if (opts.recursive) qs.recursive = 'true'
  if (opts.sorted) qs.sorted = 'true'
  if (opts.consistent) qs.consistent = 'true'

  return this._request({
    uri: this._key(key),
    qs: qs,
    json: true,
    pool: opts.wait ? false : undefined
  }, cb)
}

Client.prototype.wait = function (key, opts, cb) {
  if (typeof opts === 'function') return this.wait(key, null, opts)
  if (!opts) opts = {}
  opts.wait = true

  var self = this
  var next = function (cb) {
    self.wait(key, opts, cb)
  }

  return this.get(key, opts, function onresult (err, result) {
    if (err && err.code === 'ETIMEDOUT') return self.get(key, opts, onresult)
    if (result) opts.waitIndex = result.node.modifiedIndex + 1
    if (err) return cb(err, null, next)
    cb(null, result, next)
  })
}

Client.prototype.del = Client.prototype.delete = function (key, opts, cb) {
  if (typeof key === 'function') return this.del('', null, key)
  if (typeof opts === 'function') return this.del(key, null, opts)
  if (!opts) opts = {}
  if (!cb) cb = noop

  var qs = {}
  if (opts.prevExist !== undefined) qs.prevExist = '' + opts.prevExist
  if (opts.prevValue !== undefined) qs.prevValue = this._json ? JSON.stringify(opts.prevValue) : '' + opts.prevValue
  if (opts.prevIndex !== undefined) qs.prevIndex = '' + opts.prevIndex
  if (opts.recursive) qs.recursive = 'true'
  if (opts.dir) qs.dir = 'true'

  this._request({
    method: 'DELETE',
    uri: this._key(key),
    qs: qs,
    json: true
  }, cb)
}

Client.prototype.compareAndSwap = function (key, val, prevValue, opts, cb) {
  if (typeof opts === 'function') return this.compareAndSwap(key, val, prevValue, null, opts)
  if (!opts) opts = {}
  if (!cb) cb = noop

  opts.prevValue = prevValue
  this.set(key, val, opts, cb)
}

Client.prototype.compareAndDelete = function (key, val, opts, cb) {
  if (typeof opts === 'function') return this.compareAndDelete(key, val, null, opts)
  if (!opts) opts = {}
  if (!cb) cb = noop

  opts.prevValue = val
  this.del(key, opts, cb)
}

Client.prototype.push = function (key, value, opts, cb) {
  if (typeof opts === 'function') return this.push(key, value, null, opts)
  if (!opts) opts = {}

  this._request({
    method: 'POST',
    uri: this._key(key),
    form: {
      value: value,
      ttl: opts.ttl
    },
    json: true
  }, cb)
}

Client.prototype.mkdir = function (key, opts, cb) {
  if (typeof opts === 'function') return this.mkdir(key, null, opts)
  if (!opts) opts = {}
  opts.dir = true
  this.set(key, null, opts, cb)
}

Client.prototype.rmdir = function (key, opts, cb) {
  if (typeof opts === 'function') return this.rmdir(key, null, opts)
  if (!opts) opts = {}
  opts.dir = true
  this.del(key, opts, cb)
}

Client.prototype._key = function (key) {
  return '/v2/keys/' + (key[0] === '/' ? key.slice(1) : key)
}

Client.prototype.machines = function (cb) {
  var self = this
  this._request({uri: '/v2/machines'}, function (err, body) {
    if (err) return cb(err)

    body = body.trim()
    var hosts = body.split(/\s*,\s*/)

    if (self._refresh && body !== self._prev) {
      self._prev = body
      for (var i = 0; i < self._hosts.length; i++) {
        if (hosts.indexOf(self._hosts[i]) === -1) self._hosts.splice(i--, 1)
      }
      for (var j = 0; j < hosts.length; j++) {
        if (self._hosts.indexOf(hosts[j]) === -1) self._hosts.push(hosts[i])
      }
    }

    cb(null, hosts)
  })
}

Client.prototype.leader = function (cb) {
  this._request({uri: '/v2/leader'}, cb)
}

Client.prototype.destroy = function () {
  this._destroyed = true
  if (this._interval) clearInterval(this._interval)
  this._requests.forEach(function (request) {
    request.abort()
    if (request.timeoutTimer) clearTimeout(request.timeoutTimer)
    if (request.listeners('error').length) request.emit('error', new Error('store destroyed'))
  })
  this._requests = []
}

var decodeJSON = function (node) {
  if (node.nodes) node.nodes.forEach(decodeJSON)
  if (node.value !== undefined) node.value = JSON.parse(node.value)
}

var toError = function (response) {
  var body = response.body
  if (!body || !body.message) return new Error('bad status: ' + response.statusCode)

  var err = new Error(body.message)
  err.code = body.errorCode
  err.cause = body.cause
  err.index = body.index

  return err
}

var gc = function (list, item) {
  var i = list.lastIndexOf(item)
  if (i === -1) return
  if (i === list.length - 1) list.pop()
  else if (i === 0) list.shift()
  else list.splice(i, 1)
}

var nextTick = function (cb, err, val) {
  process.nextTick(function () {
    cb(err, val)
  })
}

Client.prototype._request = function (opts, cb) {
  if (this._discovery) return this._discoveryAndRequest(opts, cb)
  return this._request2(opts, cb)
}

Client.prototype._discoveryAndRequest = function (opts, cb) {
  if (!cb) cb = noop

  var fn
  var destroyed = false
  var self = this

  this._resolveToken(function (err) {
    if (destroyed) return
    if (err) return cb(err)
    fn = self._request2(opts, cb)
  })

  return function destroy () {
    destroyed = true
    if (fn) fn()
  }
}

Client.prototype._resolveToken = function (cb) {
  if (this._wait) return this._wait.push(cb)
  this._wait = []

  var self = this
  var done = function (err) {
    self._discovery = null
    cb(err)
    while (self._wait.length) self._wait.shift()(err)
    self._wait = null
  }

  request(this._discovery, {json: true}, function (err, response) {
    if (err) return done(err)
    if (response.statusCode !== 200) return done(new Error('discovery token could not be resolved'))

    var nodes = response.body.node.nodes.map(function (node) {
      return node.value.replace(/:7001/g, ':4001') // remap ports for now - there is probably a better way
    })

    self._hosts = nodes
    self._prev = nodes.join(',')
    self._next = roundround(self._hosts)
    self.autoRefresh() // we are doing auto discovery
    self._discovery = null

    done()
  })
}

Client.prototype._request2 = function (opts, cb) {
  var self = this
  var tries = this._hosts.length
  var path = opts.uri[0] === '/' && opts.uri
  if (path) opts.uri = this._next() + path
  opts.timeout = this._timeout

  var canceled = false

  if (this._destroyed) return nextTick(cb, new Error('store destroyed'))

  var req = request(opts, function onresponse (err, response) {
    gc(self._requests, req)

    if (canceled) return
    if (self._destroyed) return cb(new Error('store destroyed'))
    if (err && tries-- > 0) return request(opts.uri = self._next() + path, opts, onresponse)
    if (err) return cb(err)

    if (response.statusCode === 307) return request(opts.uri = response.headers.location, opts, onresponse)
    if (response.statusCode === 404 && !opts.method || opts.method === 'GET') return cb()
    if (response.statusCode > 299) return cb(toError(response))

    var body = response.body
    if (!self._json || !body.node) return cb(null, body)

    try {
      decodeJSON(body.node)
    } catch (err) {
      return cb(err)
    }

    cb(null, body)
  })

  this._requests.push(req)

  return function destroy () {
    canceled = true
    req.abort()
  }
}

module.exports = Client
