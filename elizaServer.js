/*
  Server program for Eliza at davilin.cse356.cs.compas.stonybrook.edu/eliza
*/
var express = require('express');
var app = express();
var fs = require("fs");
var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({extended : true}));
app.use(express.static('public'))
app.set('view engine', 'pug')
app.set('views','./views')


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
var server = app.listen(9000, function () {
  var host = server.address().address
  var port = server.address().port
  console.log("Example app listening at http://%s:%s", host, port)
})
