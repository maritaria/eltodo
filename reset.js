// run this through node to reset the database

var orm = require('orm')
var database = require('./database')

orm.connectAsync("mysql://eltodo:password@localhost/eltodo")
	.then((db) => {
		db.settings.set('instance.returnAllErrors', true);
		var models = {}
		database(db, models, () => {});
		db.dropAsync()
			.then(() => db.syncPromise())
			.then(() => models.lists.createAsync([{
				name: "Project items",
				items: [
					{ title: "Show lists", order: 0 },
					{ title: "Create lists", order: 1 },
					{ title: "Edit lists", order: 2 },
					{ title: "Delete lists", order: 3 },
					{ title: "Add items", order: 4 },
					{ title: "Check items", order: 5 },
					{ title: "Remove items", order: 6 },
					{ title: "Order items", order: 7 },
					{ title: "Order break", order: 3 }
				],
			},{
				name: "list2",
				items: [
					{ title: "list2.item1", order: 0 },
					{ title: "list2.item2", order: 1 }
				],
			}])).then(()=>db.close());
	})