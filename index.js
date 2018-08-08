// index.js

const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const express = require('express');
var request = require('request');
var cors = require('cors')
const app = express();
const AWS = require('aws-sdk');

const uuidV1 = require('uuid/v1');

const GEOJSON_TABLE = process.env.GEOJSON_TABLE;

const IS_OFFLINE = process.env.IS_OFFLINE;

let dynamoDb;

if (IS_OFFLINE === 'true') {
  dynamoDb = new AWS.DynamoDB.DocumentClient({
    region: 'localhost',
    endpoint: 'http://localhost:8000'
  })
  console.log(dynamoDb);
} else {
  dynamoDb = new AWS.DynamoDB.DocumentClient();
};

app.use(cors())
app.use(bodyParser.json({ strict: false }));
app.use(bodyParser.urlencoded({extended : false}));

app.get('/', function (req, res) {
  res.send('Hello World!')
})

// Get User endpoint
app.get('/form/:Id', function (req, res) {
  //console.log('print req');
  //console.log(req);
  const params = {
    TableName: GEOJSON_TABLE,
    Key: {
      Id: req.params.Id,
    },
  }
  dynamoDb.get(params, (error, result) => {
    if (error) {
      console.log(error);
      res.status(400).json({ error: 'Could not get form' });
    }
    if (result.Item) {
      const {Id, data} = result.Item;
      res.json({ Id, data });
    } else {
      res.status(404).json({ error: "form not found" });
    }
  });
})

function replaceJSONEmptyStrings (json) {
    for(var key in json) {
       //console.log('print json[key]');
       //console.log(json[key]);
       if (json[key] == '') {
          //console.log('value is empty');
          json[key] = 'no_data';
       }
    }
    return json;
}

function postGeoJSON(req,res) {

      console.log('generate a UUID timestamp');
      console.log(uuidV1());

      console.log('req body');
      console.log(req.body);

      console.log('starting replaceJSONEmptyStrings function');
      var emptyJSON = replaceJSONEmptyStrings(req.body);

      //console.log('print emptyJSON');
      //console.log(emptyJSON);

      const Id = uuidV1();

      //const geojson = req.body.files.aoi.content;

      const params = {
        TableName: GEOJSON_TABLE,
        Item: {
          Id: Id,
          data: emptyJSON,
        },
      };

      //const params = req.body

      dynamoDb.put(params, (error) => {
        if (error) {
          console.log(error);
          res.status(400).json({ error: 'Could not create dynamoDB post' });
        }
        res.json({ Id });
      });

}

function verifyreCaptcha(req, callback) {

  console.log('starting verifyCaptcha function');

  //https://codeforgeek.com/2016/03/google-recaptcha-node-js-tutorial/
  // g-recaptcha-response is the key that browser will generate upon form submit.
  // if its blank or null means user has not selected the captcha, so return the error.

  if(req.body['g-recaptcha-response'] === undefined || req.body['g-recaptcha-response'] === '' || req.body['g-recaptcha-response'] === null) {
    //return res.json({"responseCode" : 1,"responseDesc" : "Please select captcha"});
    callback(false);
  }

  // Put your secret key here.
  var secretKey = "6LdUIGUUAAAAABKqnfjw0z2YgU3TK5CJbJzmbXQn";

  // req.connection.remoteAddress will provide IP address of connected user.
  var verificationUrl = "https://www.google.com/recaptcha/api/siteverify?secret=" + secretKey + "&response=" + req.body['g-recaptcha-response'] + "&remoteip=" + req.connection.remoteAddress;

  // Hitting GET request to the URL, Google will respond with success or error scenario.
  console.log('print verificationUrl');
  console.log(verificationUrl);

  request(verificationUrl,function(error,response,body) {
      body = JSON.parse(body);
      console.log("print body1");
      console.log(body);
      //return body;
      callback(body);
  });

}


// Create form endpoint
app.post('/forms', function (req, res) {

  console.log('print req body');
  console.log(req.body);

  verifyreCaptcha(req, function(success) {

        if (success) {
            console.log("Success!");
            console.log("print body");
            console.log(success);

            if (success.success !== undefined && !success.success) {
              return res.json({"responseCode" : 1,"responseDesc" : "Failed captcha verification"});
            } else {
              console.log('captcha was a success');
              console.log('print req.body');
              console.log(req.body);
              //if description is only_verify_captcha then do nothing
              if (req.body.description == 'only_verify_captcha') {
                  //post fields to DynamoDB
                  console.log('going to post data to DynamoDB');
                  postGeoJSON(req,res);
              } else {
                  //or else post geojson
                  console.log('going to post geoJSON');
                  postGeoJSON(req,res);
              }
            }
                // TODO: do registration using params in req.body
        } else {
            return res.json({"responseCode" : 1,"responseDesc" : "Please select captcha"});
            // TODO: take them back to the previous page
            // and for the love of everyone, restore their inputs
        }
  });

  //console.log('verifyCaptcha function done');

});

module.exports.handler = serverless(app);
