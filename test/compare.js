var test = require('./helpers/test')

test('update', function (store, t) {
  store.update('etcdjs/test', 'value', function (err, result) {
    t.ok(err, 'no error')
    t.end()
  })
})

test('compareAndSwap', function (store, t) {
  store.set('etcdjs/test', 'a', function () {
    store.compareAndSwap('etcdjs/test', 'b', 'b', function (err) {
      t.ok(err, 'error is truthy (expected)')
      store.compareAndSwap('etcdjs/test', 'b', 'a', function (err) {
        t.ok(!err, 'no error')
        store.get('etcdjs/test', function (err, result) {
          t.ok(!err, 'no error')
          t.same(result.node.value, 'b', 'retrieved value matches set value')
          t.end()
        })
      })
    })
  })
})

test('compareAndDelete', function (store, t) {
  store.set('etcdjs/test', 'a', function () {
    store.compareAndDelete('etcdjs/test', 'b', function (err) {
      t.ok(err, 'error is truthy (expected)')
      store.compareAndDelete('etcdjs/test', 'a', function (err) {
        t.ok(!err, 'no error')
        store.get('etcdjs/test', function (err, result) {
          t.ok(!err, 'no error')
          t.ok(!result, 'no result (deleted)')
          t.end()
        })
      })
    })
  })
})

test('push', function (store, t) {
  store.push('etcdjs/test', 'a', function (err, result) {
    t.ok(!err, 'no error')
    t.ok(result.node.key, 'result key is truthy')
    store.get(result.node.key, function (err, result) {
      t.ok(!err, 'no error')
      t.same(result.node.value, 'a', 'retrieved value matches pushed value')
      t.end()
    })
  })
})
