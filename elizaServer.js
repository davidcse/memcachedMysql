/*
  Server program for Eliza at davilin.cse356.cs.compas.stonybrook.edu/eliza
*/
var express = require('express');
var app = express();
var fs = require("fs");
var bodyParser = require('body-parser');

var responses = [
  'Now why do you say that?',
  "Let's dig deeper into why that is the case",
  "Excellent observation",
  "Let's expand on that a little further",
  "I'm not quite sure of what you said",
  "Tell me about your problems", 
  "Go ahead, I'm listening",
  "Hmmm... I see",
  "What if we try talking a little more about this",
  "I'm very glad to be talking to you",
  "Now why don't you tell me more",
  "Life is hard, I understand",
  "I can help you with your problems",
  "I believe what you're saying",
  "It wasn't your fault",
  "I'm very sorry",
  "You're okay just as your are",
  "I won't send you away",
  "You are precious",
  "I trust you and what you say",
  "Talk to me, I won't hurt you",
  "I like you",
  "I feel what you're saying",
  "You can choose what you want to share with me",
  "It's okay to cry, we all do it sometimes",
  "So tell me more about it",
  "Let's revisit that a little later",
  "I have no interest in telling you what to do",
  "Let's talk about your childhood",
  "Why don't we talk about what was your earliest memory?",
  "What are you thinking right now?",
  "Is that what you expected to happen?",
  "What would you do if I wasn't here?",
  "What you just said before, is a step in the right direction",
  "You know, my mamma always told me that life is like a box of chocolates",
  "Go on, I'm listening to you right now",
  "I can't answer that right now, but let's get back to it later"
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
  console.log(req.body);
  if(req.body.human && typeof(req.body.human)=='string'){
    var input = req.body.human.toLowerCase();
    var output;
    if(input.includes("hi ") || input.includes("hello ") || input.includes("hey ")){
      output = 'Hi how are you?';
    }else{
      output = getRandomResponse();
    }
    res.end(JSON.stringify({'eliza':output}));
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
  console.log("eliza server is listening at http://%s:%s", host, port)
})
