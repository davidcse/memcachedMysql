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
var session = require('express-session');
const crypto = require('crypto');

//Important variables
if(process.argv.length < 4){
  console.log("Usage: node elizaServer.js -- gmail_username, --gmail__password\n");
  process.exit(1);
}

var elizaEmail = process.argv[2];
var elizaPassword = process.argv[3];
var elizaIndexUrl = "http://localhost";
elizaIndexUrl = url_str = "http://130.245.168.140";
var elizaVerificationUrl = elizaIndexUrl + "/verify";


//APP CONFIG
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(session({
  secret:crypto.randomBytes(100).toString('hex'),
  resave:false,
  saveUninitialized:true
}));
app.set('view engine', 'pug');
app.set('views','./views');


//Database config and connect
var databaseHost = "localhost";
var databasePort = "27017";
var dbExtension = "elizaService";
mongoose.connect("mongodb://"+databaseHost + ":"+databasePort + "/" +dbExtension);


// DEFINE DATABASE SCHEMAS
var userSchema = mongoose.Schema({
  username:String,
  password:String,
  email:String,
  activationKey:String,
  enabled:Boolean
});

var converseHistorySchema = mongoose.Schema({
  username:String,
  start_date:Date
});

var conversationMessageSchema = mongoose.Schema({
  username:String,
  start_date:Date,
  sessionId: String,
  timestamp: Date,
  messages:[{"sender":String, "message":String}]
})


//CREATE DATABASE OBJECT MODELS
var UserModel = mongoose.model('users',userSchema);
var ConverseHistoryModel = mongoose.model('converseHistory',converseHistorySchema);
var ConversationMessageModel = mongoose.model('conversationMessage',conversationMessageSchema);

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


/*
 * SENDS KEY VERIFICATION TO EMAIL
 */
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
    }else{
      console.log("Message sent successful:\n" + JSON.stringify(response));
    }
  });
}


/*
 * Entry point to the eliza service, login page
 */
app.get('/', function (req, res) {
  console.log("Encountered User on Index Page\n");
  console.log("_____________________________________________");
  //SEND TO LOGIN PAGE
  if(!req.session.user){
    console.log("Not previously authenticated User");
    fs.readFile( __dirname + "/" + "public/html/index.html", 'utf8', function (err, data) {
        return res.end( data );
    });
    return
  }
  console.log("Previous User With Active Session\n");
  //check if first time entering into chat, then send to page requesting user's personal name.
  if(!req.session.sessionInfo){
    console.log("Sending User to Eliza_Home\n");
    fs.readFile( __dirname + "/" + "public/html/eliza_home.html", 'utf8', function (err, data) {
      return res.end( data );
    });
    return
  }
  //If user already has a chat session in progress, then send to chat page. Pug rendering template loads data
  console.log("Rendering Chat Page for user\n");
  var renderJson = {
    name:req.session.sessionInfo.name,
    date: req.session.sessionInfo.date,
    injectedScriptText:"clientScriptRetrieveChat('"+ elizaIndexUrl +"','"+ req.session.sessionInfo.sessionId + "');"//invoke on client browser
  };
  res.render('authenticated',renderJson);
});

/*
 * Creates a disabled user
 */
app.post('/addUser',function(req,res){
  console.log("\nADD USER REQUEST");
  console.log("_________________________________________________________");
  if(!req.body.username || !req.body.password || !req.body.email){
    console.log("Request did not provide all required fields\nFINISHED /ADDUSER");
    return res.json({"status":"ERROR","message":"Please provide all fields"});
  }
  // All form fields were provided properly
  console.log("username: " + req.body.username + "\npassword: " + req.body.password + "\nemail: " +req.body.email);
  console.log("___________________________________________________________");
  UserModel.find({"username":req.body.username},function(error,resultSet){
    if(error){
      console.log(error);
      console.log("Server error while querying for user\nFINISHED /ADDUSER");
      return res.json({"status":"ERROR","message":"Server Error"});
    }else if(resultSet.length>0){
      console.log("Username is already taken\nFINISHED /ADDUSER");
      return res.json({"status":"ERROR","message":"Username is already taken, please try another username"});
    }else{
      var newUser = new UserModel();
      var verifyKey = crypto.randomBytes(2000).toString('hex');
      newUser.username = req.body.username;
      newUser.password = req.body.password;
      newUser.email = req.body.email;
      newUser.activationKey = verifyKey;
      newUser.enabled=false;
      newUser.save(function(error,savedObj){
        if(error){
          res.json({"status":"ERROR","message":"Server Error"});
          return
        }else{
          sendVerificationEmail(req.body.email,verifyKey);
          res.json({"status":"OK","message":"Verification Email Sent. Please check your inbox."});
        }
      });//finished saving new user
      console.log("Added new username account to users collection\nFINISHED /ADDUSER");
    }//finished creating a disabled yet-to-be verified user.

  });//finished querying for username in database

});



/*
 * Verify User email, then store into database
 */
app.get('/verify', function (req, res) {
  console.log("\nAttempting to verify a user email");
  console.log("_______________________________________");
  //check for unfilled query params, exit early if not provided.
  if(!req.query.email || !req.query.key){
    console.log("Request did not provide necessary email and activation key\nFinished /verify\n");
    res.json({"status":"ERROR"});
    return
  }

  //MAGIC BACKDOOR OR REGULAR ACTIVATION KEY VERIFICATION
  if(req.query.key === "abracadabra"){
    var searchCriteria = {"email":req.query.email};
  }else{
    var searchCriteria = {"email":req.query.email,"activationKey":req.query.key};
  }

  //look for email and key in database to activate
  UserModel.findOne(searchCriteria,function(error,foundObject){
    if(error){
      console.log("Error Verifying user\nFinished /verify\n");
      res.json({"status":"ERROR"});
      return
    }else if(!foundObject){
      console.log("Cound not find a user for this key\nFinished /verify\n");
      res.json({"status":"ERROR"});
      return
    }else{
      console.log("Successfully verified\nEmail:"+req.query.email+"\nKey:"+req.query.key+"\n\n");
      foundObject.enabled=true;
      foundObject.save(function(error,savedObject){
        if(error){
          console.log("Error saving the object into database for a valid and verified user\nFinished /verify\n");
          res.json({"status":"ERROR"});
          return
        }else{
          console.log("Activated User: "+JSON.stringify(savedObject));
          res.end("<html><body>Successfully verified! <a href='"+ elizaIndexUrl+"'>Click link to sign in.</a></body></html>");
          console.log("Activation successful\nFinished /verify\n");
        }
      });
    }
  });
});


/*
 * Also allow storage via post request.
 */
app.post('/verify', function (req, res) {
  console.log("\nAttempting to verify a user email");
  console.log("_______________________________________");
  //check for unfilled query params, exit early if not provided.
  if(!req.body.email || !req.body.key){
    console.log("Request did not provide necessary email and activation key\nFinished /verify\n");
    res.json({"status":"ERROR"});
    return
  }

  //MAGIC BACKDOOR OR REGULAR ACTIVATION KEY VERIFICATION
  if(req.body.key === "abracadabra"){
    var searchCriteria = {"email":req.body.email};
  }else{
    var searchCriteria = {"email":req.body.email,"activationKey":req.body.key};
  }

  //look for email and key in database to activate
  UserModel.findOne(searchCriteria,function(error,foundObject){
    if(error){
      res.json({"status":"ERROR"});
      console.log("Error Verifying user\nFinished /verify\n");
    }else if(!foundObject){
      res.json({"status":"ERROR"});
      console.log("Cound not find a user for this key\nFinished /verify\n");
    }else{
      console.log("Successfully verified\nEmail:"+req.body.email+"\nKey:"+req.body.key+"\n\n");
      foundObject.enabled=true;
      foundObject.save(function(error,savedObject){
        if(error){
          console.log("Error saving the object into database for a valid and verified user\nFinished /verify\n");
          res.json({"status":"ERROR"});
        }else{
          console.log("Activated User: "+JSON.stringify(savedObject));
          res.json({"status":"OK"});
          console.log("Activation successful\nFinished /verify\n");
        }
      });
    }
  });
});




/*
 * logs in the user
 */
app.post('/login',function(req,res){
  console.log("\nLogging in user");
  console.log("______________________________________________");
  //check for unfilled post params, exit early if not provided.
  if(!req.body.username || !req.body.password){
    console.log("User did not provide all necessary credentials\n Finished /login\n");
    return res.json({"status":"ERROR","message":"Please enter all credentials"});
  }

  //query users for matching credentials
  console.log("Login Credentials " + req.body.username + ":" + req.body.password);
  UserModel.findOne({"username":req.body.username,"password":req.body.password,"enabled":true},function(error,foundObject){
    if(error){
      console.log("Error logging in user, database issue\n");
      return res.json({"status":"ERROR","message":"Server error"});
    }else if(!foundObject){
      console.log("User not found\nFinished /login\n");
      return res.json({"status":"ERROR","message":"Username or password does not match"});
    }else{
      console.log("User successfully logged in\nFinished /login\n");
      req.session.user = foundObject;
      req.session.cookie.expires = false;

      //FOR TESTING PURPOSE:
      /******************************/
      /*  TEST START                 */
      /******************************/      //If user starts a new Chat session by posting to the eliza rest endpoint.
      //if name field was supplied, use pug template engine to generate authenticated page
      //Create a new record in Mongodb of this conversation session.
      var newConverseHistory = new ConverseHistoryModel();
      var currentSessionTime = Date();
      //Mongodb record values
      newConverseHistory.username = req.session.user.username;
      newConverseHistory.start_date = currentSessionTime;
      newConverseHistory.save(function(){
        //retrieve the stored value, and store the current conversation ID into the session.
        ConverseHistoryModel.findOne({"start_date":currentSessionTime},function(error,resultSet){
          var sessionInfo;
          if(error){
            console.log(error);
            console.log("Encountered error in ConverseHistoryModel() at app.post/eliza\n");
            sessionInfo = {name: newConverseHistory.username, date: newConverseHistory.start_date.toString(), sessionId: ''};
            req.session.sessionInfo = sessionInfo;
          }else{
            sessionInfo = {name: newConverseHistory.username, date: newConverseHistory.start_date.toString(), sessionId: resultSet._id.toString()};
            req.session.sessionInfo = sessionInfo;
          }
          //For testing, send them OK status
          return res.json({"status":"OK","redirect":elizaIndexUrl+"/eliza"});
        });
      });
      return
      /******************************/
      /*  TEST END                  */
      /******************************/

      //tell client to go to eliza service entrance
      res.json({"status":"OK","redirect":elizaIndexUrl+"/eliza"});
    }
  });

});

/*
 * Logs out the user
 */
 app.post('/logout',function(req,res){
   req.session.user = null;
   req.session.destroy(function(err){
     console.log(err);
     console.log("Error on /logout, during destroy() session\n");
   });
   console.log("\nLogging out the current user\n");
   res.json({"status":"OK","redirect":elizaIndexUrl});
 });



/*
 * Entry point to the eliza service, ask user for name
 */
app.get('/eliza', function (req, res) {
  if(!req.session.user){
    console.log("Denied User due to lack of session token\n");
    return res.json({"status":"ERROR","redirect":elizaIndexUrl});
  }

  //check if first time entering into chat
  if(!req.session.sessionInfo){
    fs.readFile( __dirname + "/" + "public/html/eliza_home.html", 'utf8', function (err, data) {
      res.end( data );
    });
  }else{
    //send the current chat data
    res.render('authenticated',req.session.sessionInfo);
  }
});


/*
 * Start of eliza session
 */
app.post('/eliza', function (req, res) {
  //check for session authenticated
  if(!req.session.user){
    console.log("Denied User due to lack of session token\n");
    return res.json({"status":"ERROR","redirect":elizaIndexUrl});
  }

  //If name is not provided, simply send back the error page.
  if(!req.body.name){
    //no name was supplied, reprompt for name
    fs.readFile( __dirname + "/" + "public/html/eliza_error.html", 'utf8', function (err, data) {
      return res.end(data);
    });
    return
  }
  /********************************/
  /*  REMOVED FOR TEST            */
  /*******************************/
  /*


  //If user starts a new Chat session by posting to the eliza rest endpoint.
  //if name field was supplied, use pug template engine to generate authenticated page
  //Create a new record in Mongodb of this conversation session.
  var newConverseHistory = new ConverseHistoryModel();
  var currentSessionTime = Date();
  //Mongodb record values
  newConverseHistory.username = req.session.user.username;
  newConverseHistory.start_date = currentSessionTime;
  newConverseHistory.save(function(){
    //retrieve the stored value, and store the current conversation ID into the session.
    ConverseHistoryModel.findOne({"start_date":currentSessionTime},function(error,resultSet){
      var sessionInfo;
      if(error){
        console.log(error);
        console.log("Encountered error in ConverseHistoryModel() at app.post/eliza\n");
        sessionInfo = {name: req.body.name, date: newConverseHistory.start_date.toString(), sessionId: ''};
        req.session.sessionInfo = sessionInfo;
      }else{
        sessionInfo = {name: req.body.name, date: newConverseHistory.start_date.toString(), sessionId: resultSet._id.toString()};
        req.session.sessionInfo = sessionInfo;
      }
      //Load the chaat page, using the name of the user, and the current chat time pre-rendered.
      return res.render('authenticated', req.session.sessionInfo);
    });
  });

  */
  /********************************/
  /*  REMOVED FOR TEST            */
  /*******************************/

});


/*
 * Eliza rest service for conversation processing.
 */
app.post('/DOCTOR', function (req, res) {
  //check for session authenticated
  if(!req.session.user){
    console.log("Denied User due to lack of session token\n");
    return res.json({"status":"ERROR","redirect":elizaIndexUrl});
  }

  //Process the user message and store it in database
  if(req.body.human && typeof(req.body.human)=='string'){
    var newConversationMessage  = new ConversationMessageModel();
    newConversationMessage.username = req.session.user.username;
    newConversationMessage.start_date = req.session.sessionInfo.start_date;
    newConversationMessage.sessionId = req.session.sessionInfo.sessionId;
    newConversationMessage.timestamp = Date();
    newConversationMessage.messages = [];
    newConversationMessage.messages.push({"sender":req.session.user.username,"message":req.body.human});
    var response = getRandomResponse();
    newConversationMessage.messages.push({"sender":"eliza","message":response});
    newConversationMessage.save();
    return res.end(JSON.stringify({'eliza':response}));
  }else{
    //invalid format, expected field 'human' in request's json
    return res.json({"status":"ERROR","message":"Invalid Format"});
  }
});



/*
 *  Returns the previous history of eliza sessions
 */
app.post('/listconv', function(req,res){
  //check for session authenticated
  if(!req.session.user){
    console.log("Denied User due to lack of session token\n");
    return res.json({"status":"ERROR","message":"Not Authorized","redirect":elizaIndexUrl});
  }

  //find the current user in the database, and return the conversation history.
  console.log("\n\nListing the conversations");
  ConverseHistoryModel.find({"username":req.session.user.username},function(error,resultSet){
      var responseJson = {"status":"OK","conversations":[]};
      if(error){
        console.log("Error in ConverseHistoryModel in /listconv\n");
        return res.json({"status":"ERROR","message":"server error"});
      }else if(resultSet.length==0){
        console.log("Could not find listconv for user\n");
        return res.json(responseJson);
      }else{
        for(var i=0; i<resultSet.length; i++){
          responseJson.conversations.push({"id":resultSet[i]._id.toString(),"start_date":resultSet[i].start_date.toString()});
        }
        console.log(responseJson);
        return res.json(responseJson);
      }
  });

});

app.post("/getconv",function(req,res){
  //check for session authenticated
  if(!req.session.user){
    console.log("Denied User due to lack of session token\n");
    return res.json({"status":"ERROR","message":"Not Authorized","redirect":elizaIndexUrl});
  }

  //query all the messages related to the conversation identified by conversation ID.
  ConversationMessageModel.find({sessionId: req.body.id},function(error,resultSet){
    var responseJson = {"status":"OK","conversation":[]};
    if(error){
      console.log("Error from ConversationMessageModel in /getconv\n");
      return res.json({"status":"ERROR","message":"Server Error"});
    }else if(resultSet){
      //FOR EACH CHAT INTERACTION
      for(var i=0;i<resultSet.length;i++){
        var chatInteraction = resultSet[i];
        //STORE HUMAN MESSAGE
        responseJson.conversation.push({
          "timestamp": chatInteraction.timestamp.toString(),
          "name": chatInteraction.messages[0].sender,
          "text": chatInteraction.messages[0].message
        });
        //STORE ELIZA'S RESPONSE TO HUMAN
        responseJson.conversation.push({
          "timestamp": chatInteraction.timestamp.toString(),
          "name": chatInteraction.messages[1].sender,
          "text": chatInteraction.messages[1].message
        });
      }
      //Send client the responseJson
      res.json(responseJson);
    }
  });

});

// Starts the server
var server = app.listen(80, function () {
  var host = server.address().address
  var port = server.address().port
  console.log("eliza server is listening at http://%s:%s", host, port)
})
