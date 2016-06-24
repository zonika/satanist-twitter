var config = require('./config.json'),
    Twitter = require('twitter'),
    userId = '445462223';

function SatanistTwitter(configs) {
  this.client = new Twitter(configs);
}

SatanistTwitter.prototype = {
  startStream: function() {
    var vm = this;
    vm.client.stream('statuses/filter', {'follow': userId}, function(stream) {
      vm.stream = stream;
      stream.on('data', function(tweet) {
        if (!tweet.user) return;
        if (tweet.user.statuses_count < 666) {
          vm.getLastTweetId();
        }
      });
    });
  }, 
  getLastTweetId: function() {
    var vm = this,
        allTweets = [],
        newTweets = [],
        params = {
          'user_id': userId,
          'count': 200,
          'include_rts': true
        };
    vm.client.get('statuses/user_timeline', params, function(error, tweets, response) {
      newTweets.push(tweets);
      params.max_id = newTweets[newTweets.length - 1].id;
      while(newTweets.length > 0) {
        allTweets.push(newTweets);
        vm.client.get('statuses/user_timeline', params, function(error, tweets, response) {
          
        });
      }
    });
   
    console.log(allTweets.length); */

  }
};

var satanistTwitter = new SatanistTwitter(config.api);
satanistTwitter.startStream();
