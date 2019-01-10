'use strict';

require('dotenv').config();

const twitter = require('twitter'),
  express = require('express'),
  crypto = require('crypto'),
  bodyParser = require('body-parser'),
  userId = process.env.USER_ID,
  maxTweets = process.env.MAX_TWEETS || 666,
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

function getCRCHash(token, secret) {
  return crypto.createHmac('sha256', secret).update(token).digest('base64');
}

function startStream() {
  const stream = client.stream('statuses/filter', { follow: userId });

  stream.on('data', (event) => {
    if (event.user.id_str === userId && event.user.statuses_count > 666) {
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
      return response.pop();
    } else {
      return getOldest(response.pop().id);
    }
  });
}

function deleteOldest(tweet) {
  console.log('deleting ' + tweet.text);
  return client.post('statuses/destroy', { id: tweet.id_str });
}

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.get('/', (req, res) => {
  res.send('you\'re obviously in the wrong place');
});

app.get('/webhook/twitter', (req, res) => {
  const token = req.query.crc_token;

  if (token) {
    const hash = getCRCHash(token, process.env.CONSUMER_SECRET);

    res.status(200);
    res.send({
      response_token: `sha256=${hash}`
    });
  } else {
    res.status(400);
    res.send('no crc_token :(');
  }
});

app.post('/webhook/twitter', (req, res) => {
  if (req.body.for_user_id === userId && req.body.tweet_create_events) {
    const user = req.body.tweet_create_events[0].user;

    if (user.statuses_count > 666) {
      getOldest().then(deleteOldest);
    }
  }

  res.send('yeehaw');
});

app.listen(process.env.PORT);
