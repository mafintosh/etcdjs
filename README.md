# etcdjs

Low level etcd v2 client written in Javascript

	npm install etcdjs

## Usage

Pass a connection string

``` js
var etcdjs = require('etcdjs');
var store = etcdjs('http://127.0.0.1:4001');

store.set('hello', 'world', function(err, result) {
	store.get('hello', function(err, result) {
		console.log('hello:', result.value);
	});
});
```

## API

#### `store = ectd(host, opts)`

`host` should be a etcd host and `opts` default to

``` js
{
	timeout: 60 * 1000, // default timeout for ops
	json: false,        // stringify/parse all values as JSON
	namespace: null     // set a key namespace
}
```

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

Set a key if it already exists. Same as `set(key, value, {prevExists:true})`

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

Create a directory. Same as `set(key, null, {dir:true})`

#### `store.rmdir(key, [opts], [cb])`

Remove a directory. Same as `del(key, {dir:true})`

#### `store.wait(key, [opts], [cb])`

Wait a key to change. Same as `get(key, {wait:true})` except the callback is called with a third argument `next` that will wait for the next change.

``` js
store.wait('hello', function onchange(err, result, next) {
	console.log('change!', result);
	next(onchange); // next will set waitIndex so we do not miss events
});
```

#### `store.compareAndSwap(key, value, prevValue, [opts], [cb])`

Only set if `prevValue` matches previous value. Similar to `set(key, value, {prevValue:prevValue})`

#### `store.compareAndDelete(key, prevValue, [opts], [cb])`

Only delete if `prevValue` matches previous value. Similar to `del(key, value, {prevValue:prevValue})`

#### `store.push(key, value, [opts], [cb])`

Create an in-order key that is guaranteed to be greater than the previous push. Check `result.key` to see the actual key.

#### `store.machines(cb)`

Returns an array of all machines in the cluster

#### `store.leader(cb)`

Returns the leader of the cluster

## Stats

#### `store.stats.self([node], cb)`

Returns node stats

#### `store.stats.store(cb)`

Returns store stats

#### `store.stats.leader(cb)`

Returns leader stats

## License

MIT