var test = require('./helpers/test')

test('machines', function (store, t) {
  store.machines(function (err, machines) {
    t.ok(!err)
    t.ok(Array.isArray(machines))
    t.ok(machines.indexOf('http://127.0.0.1:4001') > -1)
    t.end()
  })
})

test('leader', function (store, t) {
  store.leader(function (err, leader) {
    t.ok(!err)
    t.ok(leader)
    t.end()
  })
})
