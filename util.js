'use strict';

const formatUser = ({
  name,
  handle,
  screen_name,
  id,
  description
}) => ({
  name,
  handle,
  screen_name,
  id,
  description
});
function printTweet(tweet) {
  const { text, user, created_at, entities } = tweet;

  console.log(`${user.name} (@${user.screen_name}) [${created_at}]`);
  console.log(text);
}

function printUserEvent(event, type) {
  const { target, source } = event;

  console.log(`${source.name} (@${source.screen_name}) ${type} ${target.name} (@${target.screen_name})`);
}

function formatEvent(event) {
  const events = []

  if (event.tweet_create_events) {
    events.concat(event.tweet_create_events.map((tweet) => {
      printTweet(tweet);
      return parseTweet(tweet);
    }));
  }

  if (event.favorite_events) {
    events.concat(event.favorite_events
      .map(({ favorited_status, user }) => {
        console.log(`${user.name} (@${user.screen_name}) favorited:`);
        printTweet(favorited_status);

        return {
          userEvent: true,
          type: 'favorite',
          user: formatUser(user),
          tweet: user.id === process.env.USER_ID ? favorited_status.id_str : parseTweet(favorited_status)
        };
      }));
  }

  if (event.follow_events) {
    events.concat(event.follow_events.map(({ target, source }) => {
      printUserEvent({ target, source }, 'followed');
      return {
        userEvent: true,
        type: 'follow',
        source: formatUser(source),
        target: formatUser(target)
      }
    }));
  }

  if (event.block_events) {
    events.concat(event.block_events.map(({ target, source }) => {
      printUserEvent({ target, source }, 'blocked');
      return {
        userEvent: true,
        type: 'block',
        source: formatUser(source),
        target: formatUser(target)
      }
    }));
  }

  if (event.mute_events) {
    events.concat(event.mute_events.map(({ target, source }) => {
      printUserEvent({ target, source }, 'muted');
      return {
        userEvent: true,
        type: 'mute',
        source: formatUser(source),
        target: formatUser(target)
      }
    }));
  }

  return events;
}

function parseTweet(tweetObj) {
  const { user, created_at, extended_entities, entities, id_str, truncated } = tweetObj;
  const text = truncated ? tweetObj.extended_tweet.full_text : tweetObj.text;

  const tweet = {
    text,
    user: formatUser(user),
    created_at,
    id_str,
    media: extended_entities ? processMedia(extended_entities.media) : [],
    urls: processUrls(entities.urls)
  };

  if (tweetObj.quoted_status) {
    tweet.quoteTweet = parseTweet(tweetObj.quoted_status);
  }

  if (tweetObj.retweeted_status) {
    tweet.retweet = parseTweet(tweetObj.retweet);
  }

  return tweet;
}

function processUrls(urls) {
  urls.map(({ expanded_url: url, ...urlProps }) => {
    if (urlProps.unwound) {
      return { url, title: urlProps.unwound.title, description: urlProps.unwound.description };
    }
    return { url };
  });
}

function processMedia(mediaS) {
  return mediaS.reduce((acc, { type, ...media }) => {
    if (type === 'photo') {
      acc.push({ type, url: media.media_url_https || media.media_url });
    } else if ((type === 'video' || type === 'animated_gif') && media.video_info) {
      acc.push({ type, url: media.video_info.variants.find((variant) => variant.content_type === 'video/mp4') });
    }
    return acc;
  }, []);
}

module.exports = { formatEvent };
