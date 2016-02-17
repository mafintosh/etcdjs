var test = require('./helpers/test')

test('get not found', function (store, t) {
  store.get('etcdjs/test', function (err, result) {
    t.ok(!err, 'no error')
    t.ok(!result, 'no result')
    t.end()
  })
})

test('get with json option not found', function (store, t) {
  store.get('etcdjs/test', {json: true}, function (err, result) {
    t.ok(!err, 'no error')
    t.ok(!result, 'no result')
    t.end()
  })
})

test('set and get', function (store, t) {
  store.set('etcdjs/test', 'world', function () {
    store.get('etcdjs/test', function (err, result) {
      t.ok(!err, 'no error')
      t.same(result.node.value, 'world', 'result matches set value')
      t.end()
    })
  })
})

test('set and get with json option', function (store, t) {
  store.set('etcdjs/test', {hello: 'world'}, {json: true}, function () {
    store.get('etcdjs/test', {json: true}, function (err, result) {
      t.ok(!err, 'no error')
      t.same(result.node.value, {hello: 'world'}, 'result is object that matches set value')
      t.end()
    })
  })
})

test('del', function (store, t) {
  store.set('etcdjs/test', 'world', function () {
    store.del('etcdjs/test', function (err) {
      t.ok(!err, 'no error')
      store.get('etcdjs/test', function (err, result) {
        t.ok(!err, 'no error')
        t.ok(!result, 'no result (deleted)')
        t.end()
      })
    })
  })
})

test('ttl', function (store, t) {
  store.set('etcdjs/test', 'world', {ttl: 1}, function (err) {
    t.ok(!err, 'no error')
    store.get('etcdjs/test', function (err, result) {
      t.ok(!err, 'no error')
      t.same(result.node.value, 'world', 'value matches (not yet expired)')
      setTimeout(function () {
        store.get('etcdjs/test', function (err, result) {
          t.ok(!err, 'no error')
          t.ok(!result, 'no result (expired)')
          t.end()
        })
      }, 2000)
    })
  })
})
