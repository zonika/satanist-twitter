'use strict';

require('dotenv').config();

const twitter = require('twitter'),
  express = require('express'),
  crypto = require('crypto'),
  bodyParser = require('body-parser'),
  { formatEvent } = require('./util'),
  { downloadThenUpload } = require('./storage'),
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
  return client.post('statuses/destroy', { id: tweet.id_str })
    .then(() => tweet);
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

app.post('/webhook/twitter', handleWebhook);

async function handleWebhook(req, res) {
  const events = formatEvent(req.body);

  if (!req.body.for_user_id === userId || !events) {
    console.log(events);
    res.send('yeehaw');
    return;
  }

  //events.forEach(async (e) => {
    //if (e.media) {
      //e.media = await Promise.all(e.media.map(downloadThenUpload));
    //}
    //console.log(JSON.stringify(e, null, 2));
  //});

  if (req.body.tweet_create_events) {
    const user = req.body.tweet_create_events[0].user;

    if (user.id_str === userId && user.statuses_count > maxTweets) {
      getOldest()
        .then(deleteOldest);
    }
  }

  res.send('yeehaw');
}

app.listen(process.env.PORT);
