var test = require('./helpers/test')

test('update', function (store, t) {
  store.update('etcdjs/test', 'value', function (err, result) {
    t.ok(err)
    t.end()
  })
})

test('compareAndSwap', function (store, t) {
  store.set('etcdjs/test', 'a', function () {
    store.compareAndSwap('etcdjs/test', 'b', 'b', function (err) {
      t.ok(err)
      store.compareAndSwap('etcdjs/test', 'b', 'a', function (err) {
        t.ok(!err)
        store.get('etcdjs/test', function (err, result) {
          t.ok(!err)
          t.same(result.node.value, 'b')
          t.end()
        })
      })
    })
  })
})

test('compareAndDelete', function (store, t) {
  store.set('etcdjs/test', 'a', function () {
    store.compareAndDelete('etcdjs/test', 'b', function (err) {
      t.ok(err)
      store.compareAndDelete('etcdjs/test', 'a', function (err) {
        t.ok(!err)
        store.get('etcdjs/test', function (err, result) {
          t.ok(!err)
          t.ok(!result)
          t.end()
        })
      })
    })
  })
})

test('push', function (store, t) {
  store.push('etcdjs/test', 'a', function (err, result) {
    t.ok(!err)
    t.ok(result.node.key)
    store.get(result.node.key, function (err, result) {
      t.ok(!err)
      t.same(result.node.value, 'a')
      t.end()
    })
  })
})
