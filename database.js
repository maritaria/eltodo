const orm = require('orm')
module.exports = (db, models, next) => {
	models.lists = db.define('lists', {
		name: { type: 'text', unique: true },
		description: { type: 'text' },
	}, {
		validations: {
			name: orm.enforce.ranges.length(1, undefined, 'missing'),
		},
		methods: {
			completionCount: function() {
				return this.items.filter((item) => item.completed).length;
			},
		},
	});
	models.items = db.define('items', {
		title: String,
		completed: { type: 'boolean', defaultValue: false },
		order: { type: 'integer', defaultValue: 1000 },
	}, {
		validations: {
			title: orm.enforce.ranges.length(1, undefined, 'missing'),
		},
	});
	models.lists.hasMany('items', models.items, {}, {
		key: true,
		autoFetch: true,
		reverse: 'list',
	});
	next();
};