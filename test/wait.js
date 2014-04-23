var test = require('./helpers/test');

test('wait', function(store, t) {
	store.wait('etcdjs/test', function(err, result) {
		t.ok(!err);
		t.ok(result);
		t.end();
	});

	setTimeout(function() {
		store.set('etcdjs/test', 'value');
	}, 100);
});

test('wait twice', function(store, t) {
	var inc = 0;

	store.wait('etcdjs/test', function onchange(err, result, next) {
		inc++;
		t.ok(!err);
		t.ok(result);
		if (inc < 2) return next(onchange);
		t.end();
	});

	setTimeout(function() {
		store.set('etcdjs/test', 'a');
		store.set('etcdjs/test', 'b');
	}, 100);
});