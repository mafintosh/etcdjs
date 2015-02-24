# etcdjs

Low level etcd v2 client written in Javascript with failover support

```
npm install etcdjs
```

## Usage

Pass a connection string

``` js
var etcdjs = require('etcdjs')
var store = etcdjs('127.0.0.1:4001')

store.set('hello', 'world', function(err, result) {
  store.get('hello', function(err, result) {
    console.log('hello:', result.node.value)
  })
})
```

If you have more than run instance of etcd running you can pass an array to load balance

``` js
var store = etcdjs(['127.0.0.1:4001', '127.0.0.1:4002', '127.0.0.1:4003'])
```

If you have a discovery token from https://discovery.etcd.io/ you can also pass that

``` js
var store = etcdjs('https://discovery.etcd.io/my-token')
```

`etcdjs` will automatically refresh its internal host list every 30s so you can transparently
add more machines to your cluster without updating your seed host list.

## API

#### `store = etcd(host, opts)`

`host` should be a etcd host (or an array of hosts) and `opts` default to

``` js
{
  refresh: false,        // refresh the interval host list automatically
  timeout: 60 * 1000,    // default timeout for ops
  json: false            // stringify/parse all values as JSON
}
```

**Note:** The `refresh` option will try to discover additional etcd hosts via the etcd `/machines` endpoint which may not always return hostnames which are routable. Make sure the endpoint returns what you expect before turning on this feature.

#### `store.get(key, [opts], cb)`

Get a key. `opts` defaults to

``` js
{
  recursive: false,
  sorted: false,
  wait: false,
  waitIndex: (none)
}
```

#### `store.set(key, value, [opts], [cb])`

Set a key. `opts` defaults to

``` js
{
  ttl: (none),
  dir: false,
  prevExist: (none),
  prevValue: (none),
  prevIndex: (none)
}
```

#### `store.update(key, value, [opts], [cb])`

Set a key if it already exists. Same as `set(key, value, {prevExists: true})`

#### `store.del(key, [opts], [cb])`

Delete a key. `opts` defaults to

``` js
{
  recursive: false,
  dir: false,
  prevExist: (none),
  prevValue: (none),
  prevIndex: (none)
}
```

#### `store.mkdir(key, [opts], [cb])`

Create a directory. Same as `set(key, null, {dir: true})`

#### `store.rmdir(key, [opts], [cb])`

Remove a directory. Same as `del(key, {dir: true})`

#### `store.wait(key, [opts], [cb])`

Wait a key to change. Same as `get(key, {wait: true})` except the callback is called with a third argument `next` that will wait for the next change.

``` js
store.wait('hello', function onchange (err, result, next) {
  console.log('change!', result);
  next(onchange); // next will set waitIndex so we do not miss events
});
```

`.wait` returns a destroy function which can be used to kill a waiting request.

``` js
var destroy = store.wait('hello', function onchange (err, result, next) {
  // ... do stuff ..
})

destroy()
store.set('key', 'value') // won't trigger the wait
```

#### `store.compareAndSwap(key, value, prevValue, [opts], [cb])`

Only set if `prevValue` matches previous value. Similar to `set(key, value, {prevValue: prevValue})`

#### `store.compareAndDelete(key, prevValue, [opts], [cb])`

Only delete if `prevValue` matches previous value. Similar to `del(key, value, {prevValue: prevValue})`

#### `store.push(key, value, [opts], [cb])`

Create an in-order key that is guaranteed to be greater than the previous push. Check `result.key` to see the actual key.

#### `store.machines(cb)`

Returns an array of all machines in the cluster

#### `store.leader(cb)`

Returns the leader of the cluster

#### `store.destroy()`

Destroy the client and all open connections

## Stats

#### `store.stats.self([node], cb)`

Returns node stats

#### `store.stats.store(cb)`

Returns store stats

#### `store.stats.leader(cb)`

Returns leader stats

## License

MIT
