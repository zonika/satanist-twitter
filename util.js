'use strict';

function formatEvent(event) {
  if (event.tweet_create_events) {
    return event.tweet_create_events.map(parseTweet);
  } else if (event.favorite_events) {
    return event.favorite_events
      .map(({ favorited_status, user }) => ({
        userEvent: true,
        type: 'favorite',
        user,
        tweet: user.id === process.env.USER_ID ? favorited_status.id_str : parseTweet(favorited_status)
      }));
  } else if (event.follow_events) {
    return event.follow_events.map(({ target, source }) => ({
      userEvent: true,
      type: 'follow',
      source,
      target
    }));
    event.follow_events.forEach((event) => formatUserEvent(event, 'followed'));
  } else if (event.block_events) {
    return event.block_events.map(({ target, source }) => ({
      userEvent: true,
      type: 'block',
      source,
      target
    }));
  } else if (event.mute_events) {
    return event.mute_events.map(({ target, source }) => ({
      userEvent: true,
      type: 'mute',
      source,
      target
    }));
  }
}

function parseTweet(tweetObj) {
  const { user, created_at, extended_entities, entities, id_str, truncated } = tweetObj;
  const text = truncated ? tweetObj.extended_tweet.full_text : tweetObj.text;

  const tweet = {
    text,
    user,
    created_at,
    id_str,
    media: processMedia(extended_entities.media),
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
  mediaS.flatMap(({ type, ...media }) => {
    if (type === 'photo') {
      return { type, url: media.media_url_https || media.media_url };
    } else if ((type === 'video' || type === 'animated_gif') && media.video_info) {
      return { type, url: media.video_info.variants.find((variant) => variant.content_type === 'video/mp4') };
    } else {
      return [];
    }
  });
}

export default formatEvent;
export { parseTweet };
