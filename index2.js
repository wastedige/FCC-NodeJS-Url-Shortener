var express = require('express');
var mongodb = require('mongodb');
var url = require('url')
var app = express();
var MongoClient = mongodb.MongoClient;
var mongodburl = 'mongodb://wastedige:salamsalam@ds013931.mlab.com:13931/heroku_d4v0mh31';
var collection;

// 1. connect!
MongoClient.connect(mongodburl, function (err, db) {
  if (err) {
    console.log('Unable to connect to the mongoDB server. Error:', err);
  } else {
    //HURRAY!! We are connected. :)
    console.log('Connection established to', mongodburl);
    collection = db.collection('urls');
    //collection.drop();
    showCollection()
    console.log(__dirname)

  }
})

// add index no!


app.set('port', (process.env.PORT || 5000));
// views is directory for all template files



app.get('/new/*', function(request, response) {
  console.log(request.params[0])
  var requestedUrl = request.params[0]
  if ( validateUrl(requestedUrl) == false )
    throw console.error('Error: not a valid URL');


  collection.find({longurl: requestedUrl}).toArray(function (err, result) {
    if (err) {
      console.log(err);
    } else if (result.length) {
      console.log('Found:', result);
      response.send(JSON.stringify({
        "orig_url": requestedUrl,
        "short_url": __dirname + '\\' + result[0].id
      }))

    } else {
      console.log('No document(s) found for ' + requestedUrl);
      // generate short url
      findIndex(function(err, index){
        if (err) {
          console.log(err)
        } else {
          addUrl(requestedUrl, index)
        }
      })

    }
  })
})

app.param('add', function(req,res, next, add){
  console.log("aa" + add)
  next();
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

// http://localhost:5000/?a=http:/gfdsgdf.com&b=3
// var url = require('url');
// var url_parts = url.parse(request.url, true);
// var query = url_parts.query;
// console.log(query)

function validateUrl(value){
    return /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(value);
}

function findIndex(callback) {
  collection.find({info: 'index'}).toArray(function (err, result) {
    if (err) {
      throw err;
    } else if (result.length) {
      console.log('Found index:', result[0].value);
      callback(null, result[0].value);
    } else {
      // empty database, must add an index first!
      collection.insert({info: 'index', value: 0}, function (err, result) {
        if (err) {
          console.log(err);
        } else {
          console.log('Created index -- Inserted %d documents:', result.insertedCount, result);
          increaseIndex()
        }
      })
    }
  })
}

function addUrl(url, index) {
  collection.insert({longurl: url, id: index}, function (err, result) {
    if (err) {
      console.log(err);
    } else {
      console.log('addUrl -- Inserted %d documents:', result.insertedCount, result);
      increaseIndex()
    }
  })
}

function increaseIndex() {
  collection.update(
    {info: 'index'},
    { $inc: {value: 1} },
    { update: true },
    function (err, res) {
      if (err) {
        console.log(err);
      } else  {
        console.log('Updated index:' + res);
      }
    }
  )
}

function showCollection() {
  collection.find().toArray(function (err, result) {
    if (err) {
      console.log(err);
    } else if (result.length) {
      console.log('Found:', result);
    }
  })
}