// http://blog.modulus.io/mongodb-tutorial
var express = require('express');
var mongodb = require('mongodb');
var app = express();
var MongoClient = mongodb.MongoClient;
var mongodburl = 'mongodb://wastedige:salamsalam@ds013931.mlab.com:13931/heroku_d4v0mh31';
var collection;

app.use(express.static(__dirname + '/public'));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.set('port', (process.env.PORT || 5000));
// views is directory for all template files


// 1. connect!
MongoClient.connect(mongodburl, function (err, db) {
  if (err) {
    console.log('Unable to connect to the mongoDB server. Error:', err);
  } else {
    //HURRAY!! We are connected. :)
    console.log('Connection established to', mongodburl);
    collection = db.collection('urls');
    // collection.drop();
    showCollection()
  }
})

// fuck favicon
app.get('/favicon.ico', function(req, res)  {
    res.send()
})

app.get('/', function(req, res) {
  collection.find().toArray(function (err, result) {
    if (err) {
      console.log(err);
    } else if (result.length) {
      res.send(result);
    } else {
      res.send('Empty! Add addresses using /new/YourAddress')
    }
  })
})


app.get('/:fetchid', function(req, res) {

})

app.param('fetchid', function(req, res, next, fetchid){

  collection.find({id: parseInt(fetchid)}).toArray(function (err, result) {
    if (err) {
      console.log(err);
    } else if (result.length) {
      console.log('Redirecting to:', result[0].longurl);
      res.redirect(result[0].longurl)
    }
    else res.send('Invalid shortcut id!')
  })

  next();
});

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
        "short_url": request.protocol + '://' + request.get('host') + result[0].id
      }))

    } else {
      console.log('No document(s) found for ' + requestedUrl);
      // generate short url
      findIndex(function(err, index){
        if (err) {
          console.log(err)
        } else {
          addUrl(requestedUrl, index)
          response.send(JSON.stringify({
            "orig_url": requestedUrl,
            "short_url": request.protocol + '://' + request.get('host') + index
          }))

        }
      })

    }
  })
})

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

// http://localhost:5000/?a=http:/gfdsgdf.com&b=3
// var url = require('url');
// var url_parts = url.parse(request.url, true);
// var query = url_parts.query;
// console.log(query)

// http://stackoverflow.com/a/15855457/1319560
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
          callback(null, 0);
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
