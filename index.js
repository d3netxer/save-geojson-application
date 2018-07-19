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
app.get('/users/:Id', function (req, res) {

  const params = {
    TableName: GEOJSON_TABLE,
    Key: {
      Id: req.params.Id,
    },
  }

  dynamoDb.get(params, (error, result) => {
    if (error) {
      console.log(error);
      res.status(400).json({ error: 'Could not get user' });
    }
    if (result.Item) {
      const {Id, geojson} = result.Item;
      res.json({ Id, geojson });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  });
})

// Create User endpoint
app.post('/users', function (req, res) {

  console.log('does console log work?');
  //res.send('recieved a post3');
  console.log('yes console log work must work');

  console.log('req body');
  console.log(req.body);

  // g-recaptcha-response is the key that browser will generate upon form submit.
  // if its blank or null means user has not selected the captcha, so return the error.
  if(req.body['g-recaptcha-response'] === undefined || req.body['g-recaptcha-response'] === '' || req.body['g-recaptcha-response'] === null) {
    return res.json({"responseCode" : 1,"responseDesc" : "Please select captcha"});
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
    // Success will be true or false depending upon captcha validation.
    if(body.success !== undefined && !body.success) {
      return res.json({"responseCode" : 1,"responseDesc" : "Failed captcha verification"});
    }
    //so then it was a success
    //res.json({"responseCode" : 0,"responseDesc" : "Sucess"});
      console.log('generate a UUID timestamp');
      console.log(uuidV1());

      console.log('req body');
      console.log(req.body);
      console.log('this is the aoi content');
      console.log(req.body.files.aoi.content);


      //const description = req.body.description;
      const Id = uuidV1();
      //const type = req.body.public;
      const geojson = req.body.files.aoi.content;

      const params = {
        TableName: GEOJSON_TABLE,
        Item: {
          Id: Id,
          geojson: geojson,
        },
      };

      dynamoDb.put(params, (error) => {
        if (error) {
          console.log(error);
          res.status(400).json({ error: 'Could not create geojson post' });
        }
        res.json({ Id, geojson });
      });
  });


})

module.exports.handler = serverless(app);
