var test = require('./helpers/test')

test('machines', function (store, t) {
  store.machines(function (err, machines) {
    t.ok(!err, 'no error')
    t.ok(Array.isArray(machines), 'machines is an array')
    t.ok(machines.indexOf('http://127.0.0.1:4001') > -1 || machines.indexOf(process.env.ETCD_HOST) > -1, 'found the expected ETCD_HOST')
    t.end()
  })
})

test('leader', function (store, t) {
  store.leader(function (err, leader) {
    t.ok(!err, 'no error')
    t.ok(leader, 'leader is truthy')
    t.end()
  })
})
