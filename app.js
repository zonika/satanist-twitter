var config = require('./config.json'),
    Twitter = require('twitter'),
    Promise = require('bluebird'),
    jsonfile = require('jsonfile'),
    userId = config.userId;

function SatanistTwitter(configs) {
  this.client = new Twitter(configs);
}

SatanistTwitter.prototype = {
  tweetParams: {
    'user_id': userId,
    'count': 200,
    'include_rts': true,
    'trim_user': true
  },
  startStream: function() {
    var vm = this;
    vm.client.stream('statuses/filter', {'follow': userId}, function(stream) {
      vm.stream = stream;
      stream.on('data', function(tweet) {
        if (!tweet.user) return;
        if (tweet.user.statuses_count > 666) {
          vm.getTweetsAsync(vm.tweetParams).then(vm.getLastTweetId)
        }
      });
      stream.on('end', vm.resurrect.bind(vm));
      stream.on('error', vm.error.bind(vm));
    });
  },
  getTweetsAsync: function(params, obj) {
    //hacky but i didn't feel like using bind and bluebird wraps the promise in a new object
    var vm = obj || this,
        tweetParams = params;
    return new Promise(function(resolve, reject) {
      vm.client.get('statuses/user_timeline', tweetParams, function(error, tweets, response){
        var data = {
          'obj': vm,
          'tweets': tweets
        }
        resolve(data);
      });
    });
  },
  getLastTweetId: function(data) {
    var tweets = data.tweets,
        params = data.obj.tweetParams,
        callback = data.obj.getTweetsAsync;
    if (tweets.length > 0) {
      params.max_id = tweets[tweets.length - 1].id - 1; //no clue why you have to take 1 away from the id but...such is life
    }
    if (tweets.length < 200) {
      var lastTweet = tweets[tweets.length - 1];
      data.obj.deleteLastTweet(lastTweet);    
    } else {
      callback(params, data.obj).then(data.obj.getLastTweetId);
    }
  },
  deleteLastTweet: function(tweet) {
    //save the tweet jic
    var vm = this;
    jsonfile.readFile('deleted.json', function(err, obj) {
      var obj = obj || [];
      obj.push(tweet);
      
      jsonfile.writeFile('deleted.json', obj, function(error) {
        if (error) {
          console.error(error);
        }
      });
    });
    vm.client.post('statuses/destroy', {id: tweet.id_str}, function(error, data, response) {
      console.log('deleted ' + data.text);
    });
  },
  resurrect: function() {
    this.stream = null;
    var vm = this;
    setTimeout(function() {
      vm.startStream();
    }, 300000);
  },
  error: function(error) {
    console.error(error);
    process.exit();
  }
};

var satanistTwitter = new SatanistTwitter(config.api);
satanistTwitter.startStream();
