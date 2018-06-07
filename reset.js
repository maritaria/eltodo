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
				name: "list1",
				items: [
					{ title: "list1.item1" },
					{ title: "list1.item2" }
				],
			},{
				name: "list2",
				items: [
					{ title: "list2.item1" },
					{ title: "list2.item2" }
				],
			}])).then(()=>db.close());
	})