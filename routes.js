var Twitter = require('twitter');
var Watson = require('watson-developer-cloud');
var Yelp = require('yelp');

var client = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

var yelp = new Yelp({
  consumer_key: process.env.YELP_CONSUMER_KEY,
  consumer_secret: process.env.YELP_CONSUMER_SECRET,
  token: process.env.YELP_TOKEN,
  token_secret: process.env.YELP_TOKEN_SECRET,
});

var alchemy_language = new Watson.alchemy_language({
  api_key: process.env.ALCHEMY_KEY,
});

module.exports = function (app) {
  app.get("/api", function(req, res) {
    res.json({message: 'Welcome to the API!'});
  });

  app.get("/api/:id", function(req, res) {
    res.json({message: `The id is: ${req.params.id}`});
  });

  app.get("/api/twitter/:username/statuses/user_timeline", function(req, res) {
    console.log(req.params.username);
    client.get('statuses/user_timeline', {screen_name: req.params.username, count: 5}, function(error, tweets, response) {
      if (!error) {
        // var messages = [];
        // for(var i = 0; i < tweets.length; i++) {
        //   messages.push(tweets[i].text);
        // }
        // res.status(200).json({title: 'Express', tweets: messages});
        console.log(tweets);

        var parameters = {
          extract: 'concepts,keywords',
          text: tweets[0].text
        };

        alchemy_language.combined(parameters, function(err, response) {
          if(err) {
            console.log('Error:', err);
          } else {
            var keywords = '';
            for(var i = 0; i < response.keywords.length; i++) {
              keywords = keywords + response.keywords[i].text + ' ';
            }
            yelp.search({term: keywords, location: 'Austin'})
            .then(function(data) {
              res.status(200).json({keywords: keywords, data: data});
            })
            .catch(function(e) {
              res.status(500).json({error: e});
            });
            // yelp.search({ term: 'food', location: 'Montreal' })
            // .then(function (data) {
            //   console.log(data);
            // })
            // .catch(function (err) {
            //   console.error(err);
            // });
            // res.status(200).json({username: req.params.username, latest_tweet: tweets[0], alchemy: response});
          }
        });
        //res.status(200).json({tweets: tweets});
      } else {
        res.status(500).json({error: error});
      }
    });
  });
}
