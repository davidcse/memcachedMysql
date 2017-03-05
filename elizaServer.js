/*
  Server program for Eliza at davilin.cse356.cs.compas.stonybrook.edu/eliza
*/

//Instantiate libraries
var express = require('express');
var app = express();
var fs = require("fs");
var bodyParser = require('body-parser');
var nodemailer = require('nodemailer');
var mongoose = require('mongoose');

//Important variables
var elizaEmail =  "eliza.service.cs@gmail.com";
var elizaPassword = "elizanodeservice";
var elizaVerificationUrl = "http://localhost/verify";
var elizaIndexUrl = "http://localhost";

//Database config
var databaseHost = "localhost";
var databasePort = "27017";
var dbExtension = "elizaService";

mongoose.connect("mongodb://"+databaseHost + ":"+databasePort + "/" +dbExtension);


// DEFINE DATABASE SCHEMAS
var userSchema = mongoose.Schema({
  username:String,
  password:String,
  email:String,
  enabled:Boolean
});

var converseHistorySchema = mongoose.Schema({
  username:String,
  conversationDate:String
});

var UserModel = mongoose.model('users',userSchema);
var ConverseHistoryModel = mongoose.model('converseHistory',converseHistorySchema);



// Service for delivering verification email
var smtpService = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: elizaEmail,
        pass: elizaPassword
    }
});

//Possible responses that eliza responds with
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

/*
 *  Chooses a random response for therapy session user.
 */
function getRandomResponse() {
  var index = Math.floor(Math.random() * responses.length);
  return responses[index];
}

function sendVerificationEmail(email,verifyKey){
  // Email configuration
  var verificationEmail ={
    from: elizaEmail,
    to: email,
    subject: "Please Confirm Your Email Account",
    html: "Dear User, <br>" +
    "Please click this link to verify your email.<br>" +
    "<a href='"+ elizaVerificationUrl +"?email="+email+"&key="+verifyKey+"'>"+
    "Click this link to verify your email</a>"
  };
  // Send the email using the smtp service.
  smtpService.sendMail(verificationEmail,function(error,response){
    if(error){
      console.log(error);
      return false;
    }else{
      console.log("Message sent successful:\n" + JSON.stringify(response));
      return true;
    }
  });
}

/*
 * APP CONFIGURATION
 */
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());
app.use(express.static('public'));
app.set('view engine', 'pug');
app.set('views','./views');


/*
 * Entry point to the eliza service, ask user for name
 */
app.get('/', function (req, res) {
   fs.readFile( __dirname + "/" + "public/index.html", 'utf8', function (err, data) {
       res.end( data );
   });
});

/*
 * Creates a disabled user
 */
app.post('/addUser',function(req,res){
  console.log("\nADD USER REQUEST");
  console.log("====================================");
  if(!req.body.username || !req.body.password || !req.body.email){
    res.status(401).send();
    console.log("Request did not provide all required fields\nFINISHED /ADDUSER");
    return
  }
  // All form fields were provided properly
  console.log("username: " + req.body.username + "\npassword: " + req.body.password + "\nemail: " +req.body.email);
  console.log("=====================================================");
  UserModel.find({"username":req.body.username},function(error,resultSet){
    if(error){
      console.log(error);
      res.status(500).send();
      console.log("Server error while querying for user\nFINISHED /ADDUSER");
      return
    }else if(resultSet.length>0){
      res.end("Username is already taken, please try another username");
      console.log("Username is already taken\nFINISHED /ADDUSER");
      return
    }else{
      var newUser = new UserModel();
      newUser.username = req.body.username;
      newUser.password = req.body.password;
      newUser.email = req.body.email;
      newUser.enabled=false;
      newUser.save(function(error,savedObj){
        if(error){
          res.status(500).send();
        }else{
          emailStatus = sendVerificationEmail(req.body.email,"abracadabra");
          if(emailStatus){
            res.end("Email Verification has been sent. Please check your inbox\n");
          }else{
            res.status(500).send();
          }
        }
      });//finished saving new user
      console.log("Added new username account to users collection\nFINISHED /ADDUSER");
    }//finished creating a disabled yet-to-be verified user.

  });//finished querying for username in database
  
});


app.get('/verify', function (req, res) {
  console.log("\nAttempting to verify a user email")
  if(req.query.email && req.query.key){
    console.log("Successfully verified\nEmail:"+req.query.email+"\nKey:"+req.query.key+"\n\n");
    res.end("<html><body>Successfully verified! <a href='"+ elizaIndexUrl+"'>Click link to sign in.</a></body></html>");
    /*
    fs.readFile( __dirname + "/" + "public/index.html", 'utf8', function (err, data) {
        res.end( data );
    });
    */
  }else{
    res.end("Error: Email and Key not found\n");
  }
});

app.post('/verify', function (req, res) {
  console.log("\nAttempting to verify a user email")
  if(req.body.email && req.body.key){
    console.log("Successfully verified\nEmail:"+req.body.email+"\nKey:"+req.body.key+"\n\n");
    res.end("<html><body>Successfully verified! <a href='"+ elizaIndexUrl+"'>Click link to sign in.</a></body></html>");
  }else{
    res.end("Error: Email and Key not found\n");
  }
});


/*
 * logs in the user
 */
app.post('/login',function(req,res){
  console.log("\nLogging in user");
  if(req.body.username && req.body.password){
    console.log("Login Credentials " + req.body.username + ":" + req.body.password);
    fs.readFile( __dirname + "/" + "public/eliza_home.html", 'utf8', function (err, data) {
        res.end( data );
    });
  }else{
    console.log("User not authenticated\n");
    res.end("Unsuccessful authentication");
  }
});

/*
 * Logs out the user
 */
 app.post('/logout',function(req,res){
   console.log("\nLogging out the current user\n");

 });



/*
 * Entry point to the eliza service, ask user for name
 */
app.get('/eliza', function (req, res) {
   fs.readFile( __dirname + "/" + "public/eliza_home.html", 'utf8', function (err, data) {
       res.end( data );
   });
});


/*
 * Start of eliza session
 */
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


/*
 * Eliza rest service for conversation processing.
 */
app.post('/eliza/DOCTOR', function (req, res) {
  console.log(req.body);
  if(req.body.human && typeof(req.body.human)=='string'){
    res.end(JSON.stringify({'eliza':getRandomResponse()}));
  }else{
    //invalid format, expected field 'human' in request's json
    res.end("you sent wrong format");
  }
});


 /*
  *  Returns the previous history of eliza sessions
  */
  app.post('/listconv', function(req,res){
    console.log("\n\nListing the conversations");
  });

  /*
   *
   */

// Starts the server
var server = app.listen(80, function () {
  var host = server.address().address
  var port = server.address().port
  console.log("eliza server is listening at http://%s:%s", host, port)
})
