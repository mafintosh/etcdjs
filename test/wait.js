var test = require('./helpers/test')

test('wait', function (store, t) {
  store.wait('etcdjs/test', function (err, result) {
    t.ok(!err, 'no error')
    t.ok(result, 'result is truthy')
    t.end()
  })

  store.set('etcdjs/test', 'value')
})

test('wait twice', function (store, t) {
  var inc = 0

  store.wait('etcdjs/test', function onchange (err, result, next) {
    inc++
    t.ok(!err, 'no error')
    t.ok(result, 'result is truthy')
    if (inc < 2) return next(onchange)
    t.end()
  })

  store.set('etcdjs/test', 'a')
  store.set('etcdjs/test', 'b')
})

test('cancel wait', function (store, t) {
  var stop_wait = store.wait('etcdjs/test', function (err, result) {
    t.ok(!err, 'no error')
    t.fail('unexpected callback, wait should have stopped')
  })

  stop_wait()
  store.set('etcdjs/test', 'value')

  setTimeout(function () {
    t.end()
  }, 100)
})
