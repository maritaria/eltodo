const express = require('express');
const bodyParser = require('body-parser');
const orm = require('orm');
const handlebars = require('express-handlebars');
const app = express();

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


app.engine('handlebars', handlebars({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

// start the server
app.listen(3000);

app.get('/', (req, res, next) => {
	res.render('home');
});

app.get('/lists', (req, res, next) => {
	req.models.lists.allAsync().then((lists)=> {
		res.render('lists/list', { lists: lists });
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
			console.log(JSON.stringify(list));
			res.render('lists/edit', list);
		}).catch(next);
});

app.post('/lists/:id', (req, res, next) => {
	req.models.lists.getAsync(req.params.id)
		.then((list) => {
			list.name = req.body.name;
			list.saveAsync().then(() => {
				res.render('lists/edit', list);
			});
		}).catch(next);
});

app.post('/lists/:id/add', (req, res, next) => {
	req.models.lists.getAsync(req.params.id)
		.then((list) => {
			req.models.items.createAsync({
				title: req.body.title,
			}).then((item) => {
				list.addItems(item, { order: list.items.length });
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
			if (req.body.name != undefined)
				item.name = req.body.name;
			if (req.body.completed != undefined)
				item.completed = req.body.completed;
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