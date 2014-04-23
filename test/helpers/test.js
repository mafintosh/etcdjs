var etcdjs = require('../../');
var tape = require('tape');

module.exports = function(msg, fn) {
	tape(msg, function(t) {
		var store = etcdjs('http://127.0.0.1:4001');
		store.del('/etcdjs', {recursive:true}, function() {
			fn(store, t);
		});
	});
};