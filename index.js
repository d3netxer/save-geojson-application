// index.js

const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const express = require('express');
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

})

module.exports.handler = serverless(app);
