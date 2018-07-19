# save-geojson-application

This is a serverless application that will recieve a post request and save a geojson into a DynamoDB table on AWS.

## extra tips

### dependancies
Do an 'npm install'. Also make sure if you are running locally that you have Java installed (DynamoDB dependency).

### how to run locally
```
sls offline start
```

### hot to deploy
```
sls deploy
```

### how to add a dependency example:

```
npm install uuid --save
```
and you see it gets added into the package.json

### you can use some command locally in the terminal, ex:

```
$ aws dynamodb list-tables --endpoint-url http://localhost:8000


$ aws dynamodb scan --table-name "geojson-table-dev" --endpoint-url http://localhost:8000
```

### useful tutorials
https://serverless.com/blog/serverless-express-rest-api/
https://github.com/serverless/examples/tree/master/aws-node-rest-api-with-dynamodb-and-offline
