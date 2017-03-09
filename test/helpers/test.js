var etcdjs = require('../../')
var tape = require('tape')

var HOST = process.env.ETCD_HOST || 'http://127.0.0.1:2379'

module.exports = function (msg, fn) {
  tape(msg, function (t) {
    var store = etcdjs(HOST)
    store.del('/etcdjs', {recursive: true}, function () {
      fn(store, t)
    })
  })
}
