/*
  Server program for HW 7 at davilin.cse356.cs.compas.stonybrook.edu
*/

//Instantiate libraries
var express = require('express');
var app = express();
var fs = require("fs");
var bodyParser = require('body-parser');
var mysql = require('mysql');
var Memcached = require('memcached');
var memcached = new Memcached();
memcached.connect('127.0.0.1:11211',function(err,conn){
  if(err){
    console.log("memcached error starting");
    console.log(conn.server);
  }
});

//APP CONFIG
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());


var pool=mysql.createPool({
    connectionLimit : 500, //important
    host     : 'localhost',
    user     : 'root',
    password : 'EclipseScript7',
    database : 'hw7',
    debug    :  false
});



function handle_database(state,service_type, res) {
    //console.log("servicing request - state " + state + "\t service_type : "  + service_type);
    var queryString = "select AVG(comm_rate) AS comm_rate_avg, " +
    "AVG(ind_rate) AS ind_rate_avg, " +
    "AVG(res_rate) AS res_rate_avg " +
    "from electric  " +
    "where state='" + state+"' " +
    "AND service_type='"+service_type+"';";
    memcached.get(queryString,function(err,data){
        if(data){
          return res.json(data);
        }else{
            pool.getConnection(function(err,connection){
                if (err) {
                  return res.json({
                    "status" : "ERROR",
                    "message" : "Error in connection database"
                 });
                }
                //console.log('connected as id ' + connection.threadId);
                connection.query(queryString,function(err,rows){
                    connection.release();
                    if(!err) {
                      //console.log("Rows : " + JSON.stringify(rows));
                      if(rows){
                        var responseObj = {
                          "status": "OK",
                          "comm_rate_avg": rows[0].comm_rate_avg,
                          "ind_rate_avg": rows[0].ind_rate_avg,
                          "res_rate_avg": rows[0].res_rate_avg
                        };
                        memcached.set(queryString,responseObj,100000,function(err){
                          if(err){
                            console.log("memcached set error");
                          }
                        });
                        return res.json(responseObj);
                      }
                    }else{
            //console.log("Encountered error in result set: "+ err);
                        return res.json({
                          "status": "ERROR",
                          "message" : "No rows"
                        });

                    }
                });
                connection.on('error', function(err) {
                  return res.json({
                    "status" : "ERROR",
                    "message" : "Error in connection database"
                  });
                });
          });
        }
    });
}

app.post('/hw7', function (req, res) {
  //console.log("request body: " + req.body);
  handle_database(req.body.state,req.body.service_type,res);
});

// Starts the server
var server = app.listen(80, function () {
  var host = server.address().address
  var port = server.address().port
  console.log("server is listening at http://%s:%s", host, port)
})
