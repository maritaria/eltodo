const express = require('express');
const bodyParser = require('body-parser');
const orm = require('orm');
const handlebars = require('express-handlebars');
const app = express();
const levenshtein = require('fast-levenshtein');


// log request method and paths to console
app.use((req, res, next) => {
	console.log(req.method + " " + req.path);
	next();
});

// body-parser: turn <form> data into req.body
app.use(bodyParser.urlencoded({extended: true}));

// orm: database management layer
app.use(orm.express('mysql://eltodo:password@localhost/eltodo', {
	define: require('./database')
}));

// install json api
require('./api')(app);

app.engine('handlebars', handlebars({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

// start the server
app.listen(3000);

// serve all files in /static as direct files
app.use('/static', express.static('static'))

app.get('/', (req, res, next) => {
	res.redirect('/lists');
});

app.get('/lists', (req, res, next) => {
	
	req.models.lists.allAsync().then((lists)=> {
		var matchingList = [];
		var queryUsed = false;
		if (req.query.search != undefined) {
			queryUsed = true;
			var searchWords = req.query.search.toUpperCase().split(' ');
			console.log(searchWords);
			// perform search on items
			lists.forEach((list) => {
				var matchWords = list.name.toUpperCase().split(' ');
				if (list.description) {
					matchWords = matchWords.concat(list.description.toUpperCase().split(' '));
				}
				list.items.forEach((item) => { matchWords = matchWords.concat(item.title.toUpperCase().split(' ')); });
				console.log(matchWords);
				var matchedAny = false;
				matchWords.forEach((matchWord) => {
					searchWords.forEach((searchWord) => {
						if (matchedAny) return;
						if (matchWord.includes(searchWord)) {
							matchedAny = true;
						}
						var distance = levenshtein.get(searchWord, matchWord);
						console.log(matchWord, searchWord, distance);
						if (distance < (Math.max(searchWord.length, matchWord.length) * 0.2)) {
							matchedAny = true;
						}				
					});
				});
				if (matchedAny) {
					matchingList.push(list);
				}
			});
		} else {
			matchingList = lists;
		}
		
		res.render('lists/list', { query: req.query.search, queryUsed: queryUsed, lists: matchingList });
	}).catch(next);
	
});

app.post('/lists/new', (req, res, next) => {
	console.log(req.body);
	req.models.lists.createAsync(req.body)
		.then((item) => {
			res.redirect('/lists/' + item.id);
		}).catch(next);
});

app.get('/lists/:id', (req, res, next) => {
	req.models.lists.getAsync(req.params.id)
		.then((list) => {
			list.items.sort((a, b) => a.order - b.order);
			console.log(JSON.stringify(list.items));
			res.render('lists/edit', list);
		}).catch(next);
});

app.post('/lists/:id', (req, res, next) => {
	req.models.lists.getAsync(req.params.id)
		.then((list) => {
			list.name = req.body.name;
			list.description = req.body.description;
			list.saveAsync().then(() => {
				var order = JSON.parse(req.body.order);
				console.log(order);
				var counter = 0;
				var promises = [];
				list.getItems().each((item) => {
					item.order = order.indexOf(item.id);
					promises.push(item.saveAsync());
				});
				return Promise.all(promises)
			}).then(() => res.redirect("/lists/" + req.params.id));
		}).catch(next);
});

app.post('/lists/:id/add', (req, res, next) => {
	req.models.lists.getAsync(req.params.id)
		.then((list) => {
			req.models.items.createAsync({
				title: req.body.title,
				order: list.items.length + 1,
			}).then((item) => {
				list.addItems(item);
				return list.saveAsync()
			}).then((list) => {
				res.redirect('/lists/' + list.id);
			});
		}).catch(next);
});

app.post('/lists/:id/delete', (req, res, next) => {
	req.models.lists.getAsync(req.params.id)
		.then((list) => list.removeAsync())
		.then(() => res.redirect("/lists"))
		.catch(next);
});

app.post('/lists/:list_id/items/:item_id', (req, res, next) => {
	req.models.items.getAsync(req.params.item_id)
		.then((item) => {
			console.log(req.body);
			if (req.body.name != undefined)
				item.name = req.body.name;
			if (req.body.completed !== undefined)
				item.completed = req.body.completed == 'true';
			return item.saveAsync();
		}).then((item) => {
			res.send(JSON.stringify(item))
		}).catch(next);
});

app.post('/lists/:list_id/items/:item_id/delete', (req, res, next) => {
	req.models.items.getAsync(req.params.item_id)
		.then((item) => item.removeAsync())
		.then(() => res.redirect("/lists/" + req.params.list_id))
		.catch(next);
});

// final handler, gets called when previous things passed an error
app.use(function (err, req, res, next) {
  console.error(err.stack)
  res.status(500).send('An error occurred');
});