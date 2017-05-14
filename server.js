var express = require('express')
var app = express();
var mongoClient = require('mongodb').MongoClient;
var randomString = require('randomstring');

// use process.env.PORT to assign port on heroku else listen on 3000 
var port = process.env.PORT || 3000

// Mongodb Connection Url
var url = 'mongodb://localhost:27017/urlshortener';

app.use('/new', function(req, res){
	var reqUrl = req.originalUrl.slice(5);

	var expression = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;
	var regex = new RegExp(expression);
	
	if(reqUrl.match(regex)){
			var shortenedUrl = randomString.generate({ length: 5, charset: 'alphanumeric', capitalization: 'lowercase' });

			mongoClient.connect(url, function(err, db){
				if(err) { throw(err); }
				console.log('connected successfully to server');

				var collection = db.collection('urls');
				collection.insert({original_url: reqUrl, short_url: shortenedUrl}, function(err, result){
					if (err) { throw(err); }
					var response = result.ops[0];
					delete response._id;
					response['short_url'] = "http://localhost:3000/" + shortenedUrl;
					res.send(response);
				});

		/*
				collection.find({short_url: shortenedUrl}, {original_url: 1, short_url: 1, _id: 0}).toArray(function(err, doc){
					if (err) { throw(err) };

					res.send(doc[0]);
				});
		*/
				db.close();
			});

	} else {
		res.send(JSON.stringify({error: "Invalid Url"}));
	}
});

app.use('/', function(req, res){
	if(req.originalUrl){
		var shorUrl = req.originalUrl.slice(1);
	}
	mongoClient.connect(url, function(err, db){
		if(err) { throw(err); }
		console.log('connected successfully to server');

		var collection = db.collection('urls');

		if(shorUrl){
			collection.find({short_url: shorUrl}).toArray(function(err, doc){
				if (err) { throw(err) };
				if (doc.length > 0){
					res.redirect(doc[0].original_url);
				}else{
					res.send("Sorry the short link doesn't exist");
				}
			});
		}
		db.close();
	});
});

var server = app.listen(port, function(){
	console.log("Server started on port " + port);
});