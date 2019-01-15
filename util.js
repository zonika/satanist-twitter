'use strict';

function formatTweet(tweet) {
  const { text, user, created_at, entities } = tweet;

  console.log(`${user.name} (@${user.screen_name}) [${created_at}]`);
  console.log(text);
}

function formatFavorite(event) {
  const { favorited_status, user } = event;

  console.log(`${user.name} (@${user.screen_name}) favorited:`);
  formatTweet(favorited_status);
}

function formatUserEvent(event, type) {
  const { target, source } = event;

  console.log(`${source.name} (@${source.screen_name}) ${type} ${target.name} (@${target.screen_name})`);
}

function printEventPayload(event) {
  if (event.tweet_create_events) {
    event.tweet_create_events.forEach(formatTweet);
  } else if (event.favorite_events) {
    event.favorite_events.forEach(formatFavorite);
  } else if (event.follow_events) {
    event.follow_events.forEach((event) => formatUserEvent(event, 'followed'));
  } else if (event.block_events) {
    event.block_events.forEach((event) => formatUserEvent(event, 'blocked'));
  } else if (event.mute_events) {
    event.mute_events.forEach((event) => formatUserEvent(event, 'muted'));
  }
}

module.exports.printEventPayload = printEventPayload;
