# satanist-twitter

deletes your oldest tweet when your number of tweets goes above 666

### To Run (locally)

`npm install`, then generate all the necessary keys to run a twitter app from the account you want to attach, as this app will require read and write permissions (because we're deleting tweets) and create a config.json file with the following structure:


    {
      "userId": Your twitter account id (quickly find it [here](http://gettwitterid.com/)),
      "api": {
        "consumer_key": "xxxxx",
        "consumer_secret": "xxxxx",
        "access_token_key": "xxxxx",
        "access_token_secret": "xxxxx"
      }
    }

You'll then have to replace lines 1-9 in app.js with `var config = require('config'),` which will let you run your app locally using the command `node app`  

### To Run using Heroku

clone this repo and create a new heroku app via your heroku dashboard, then follow heroku's steps to deploying a node app. You'll need to set the config variables either through the heroku toolbelt CLI or the settings in your heroku app. The names are the same as they are above, except they'll need to be entered in all caps. The current version of app.js is already set up to access these variables via heroku, so once you deploy your app to heroku it should just start normally.

### Keeping the app awake

Because the app just listens to a stream and acts on it, and heroku servers fall asleep after an hour if there isn't any activity on the server, you need to set up a utility to ping your server every few minutes to keep it from falling asleep ever. You can set up a job via the heroku scheduler add-on that runs the command `node keep-alive` every 10 mins. keep-alive.js uses node's http utility to literally visit the site when the file is run. You'll have to change the url in this file to the one of your own heroku app so that it's visiting the correct website when it runs.

### Deleted tweets

tweets that get deleted are saved into the file deleted.json, so if you're using heroku, `git pull heroku master` every so often to see the tweets that the app has deleted.

### Todo

clean up the code that gets all the user's tweets as it's incredibly hacky and doesn't bind objects in a clean way, or have it save some of this data so we don't have to make 3+ requests to twitter every time the user tweets in order to find the current oldest tweet.
