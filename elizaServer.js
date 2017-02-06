/*
  Server program for Eliza at davilin.cse356.cs.compas.stonybrook.edu/eliza
*/
var express = require('express');
var app = express();
var fs = require("fs");
var bodyParser = require('body-parser');

var responses = [
  'Hi how are you',
  'Now why do you say that?',
  "Let's dig deeper into why that is the case",
  "Excellent observation"
]

function getRandomResponse() {
  var index = Math.floor(Math.random() * responses.length);
  return responses[index];
}

app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());
app.use(express.static('public'))
app.set('view engine', 'pug')
app.set('views','./views')

app.post('/eliza/DOCTOR', function (req, res) {
  console.log("POST DOCTOR request");
  console.log(req.body);
  if(req.body.human){
    res.end(JSON.stringify({'eliza':getRandomResponse()}));
  }else{
    //invalid format, expected field 'human' in request's json
    res.end("you sent wrong format");
  }
});

app.get('/eliza', function (req, res) {
   fs.readFile( __dirname + "/" + "public/eliza_home.html", 'utf8', function (err, data) {
       res.end( data );
   });
});

app.post('/eliza', function (req, res) {
  console.log(req.body);
  if(req.body.name){
    //if name field was supplied, use pug template engine to generate authenticated page
    res.render('authenticated', {name: req.body.name, date:Date()});
  }else{
    fs.readFile( __dirname + "/" + "public/eliza_error.html", 'utf8', function (err, data) {
      res.end(data);
    });
  }
});


// Starts the server
var server = app.listen(80, function () {
  var host = server.address().address
  var port = server.address().port
  console.log("app listening at http://%s:%s", host, port)
})
