const orm = require('orm')
module.exports = (db, models, next) => {
	models.lists = db.define('lists', {
		name: { type: 'text', unique: true },
	}, {
		validations: {
			name: orm.enforce.ranges.length(1, undefined, 'missing'),
		},
	});
	models.items = db.define('items', {
		title: String,
		completed: { type: 'boolean', defaultValue: false },
	}, {
		validations: {
			title: orm.enforce.ranges.length(1, undefined, 'missing'),
		},
	});
	models.lists.hasMany('items', models.items, {
		order: { type: 'integer' },
	}, {
		key: true,
		autoFetch: true,
		reverse: 'list',
	});
	next();
};