'use strict';

require('dotenv').config();

const twitter = require('twitter'),
  bluebird = require('bluebird'),
  express = require('express'),
  _ = require('lodash'),
  userId = process.env.USER_ID,
  config = {
    consumer_key: process.env.CONSUMER_KEY,
    consumer_secret: process.env.CONSUMER_SECRET,
    access_token_key: process.env.ACCESS_TOKEN_KEY,
    access_token_secret: process.env.ACCESS_TOKEN_SECRET
  },
  getParams = {
    user_id: userId,
    count: 200,
    include_rts: true,
    trim_user: true
  },
  client = new twitter(config),
  app = express();

function startStream() {
  const stream = client.stream('statuses/filter', { follow: userId });

  stream.on('data', (event) => {
    if (event.user.id === userId && event.user.statuses_count > 666) {
      getOldest().then(deleteOldest);
    }
  });

  stream.on('end', resurrect);

  stream.on('error', (err) => {
    throw err;

    process.exit();
  });
}

function getOldest(maxId) {
  const params = maxId ? Object.assign({}, getParams, { max_id: maxId }) : Object.assign({}, getParams);

  return client.get('statuses/user_timeline', params).then((response) => {
    if (response.length < 200) {
      return _.last(response);
    } else {
      return getOldest(_.last(response).id);
    }
  });
}

function deleteOldest(tweet) {
  console.log('deleting ' + tweet.text);
  client.post('statuses/destroy', { id: tweet.id_str });
}

function resurrect() {
  setTimeout(() => (startStream()), 30000);
}

app.get('/', (req, res) => {
  res.send('you\'re obviously in the wrong place');
});

app.listen(8008, function() {
  startStream();
});
