/*
  Server program for HW 7 at davilin.cse356.cs.compas.stonybrook.edu
*/

//Instantiate libraries
var express = require('express');
var app = express();
var fs = require("fs");
var bodyParser = require('body-parser');
var mysql = require('mysql');


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



function handle_database(req,res) {
    pool.getConnection(function(err,connection){
        if (err) {
          return {
            "status" : "ERROR",
            "message" : "Error in connection database"
         });
        }
        console.log('connected as id ' + connection.threadId);

        var queryString = "select AVG(comm_rate) AS comm_rate_avg \
        AVG(ind_rate) AS ind_rate_avg\
        AVG(res_rate) AS res_rate_avg\
        from electric\
        where state='" +req.state+"'\
        AND service_type='"+req.service_type+"';";

        connection.query(queryString,function(err,rows){
            connection.release();
            if(!err) {
              if(rows){
                return {
                  "status": "OK",
                  "comm_rate_avg": rows[0].comm_rate_avg,
                  "ind_rate_avg": rows[0].ind_rate_avg,
                  "res_rate_avg": rows[0].res_rate_avg
                }
              }
            }
        });
        connection.on('error', function(err) {
          return{
            "status" : "ERROR",
            "message" : "Error in connection database"
          };
        });
  });
}

app.post('/hw7', function (req, res) {
  var data = handle_database(req,res);
  return res.json(data);
});

// Starts the server
var server = app.listen(8080, function () {
  var host = server.address().address
  var port = server.address().port
  console.log("server is listening at http://%s:%s", host, port)
})
