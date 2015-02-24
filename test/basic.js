var test = require('./helpers/test')

test('get not found', function (store, t) {
  store.get('etcdjs/test', function (err, result) {
    t.ok(!err)
    t.ok(!result)
    t.end()
  })
})

test('set and get', function (store, t) {
  store.set('etcdjs/test', 'world', function () {
    store.get('etcdjs/test', function (err, result) {
      t.ok(!err)
      t.same(result.node.value, 'world')
      t.end()
    })
  })
})

test('del', function (store, t) {
  store.set('etcdjs/test', 'world', function () {
    store.del('etcdjs/test', function (err) {
      t.ok(!err)
      store.get('etcdjs/test', function (err, result) {
        t.ok(!err)
        t.ok(!result)
        t.end()
      })
    })
  })
})

test('ttl', function (store, t) {
  store.set('etcdjs/test', 'world', {ttl: 1}, function (err) {
    t.ok(!err)
    store.get('etcdjs/test', function (err, result) {
      t.ok(!err)
      t.same(result.node.value, 'world')
      setTimeout(function () {
        store.get('etcdjs/test', function (err, result) {
          t.ok(!err)
          t.ok(!result)
          t.end()
        })
      }, 2000)
    })
  })
})
