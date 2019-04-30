
'use strict';
//----------------------------------------------------------------

const redis = require('redis')
const log = require('fancy-log')
//----------------------------------------------------------------

class TwitchChatter {
  constructor(twitchClient, twitchChannel, redisHost, redisPort, channelPrefix) {
    this.redisClient = redis.createClient(redisPort, redisHost);
    
    // e.g. "laddspencer.chatter.say"
    let chatterChannelPrefix = `${channelPrefix}.chatter`;
    let subChannel = `${chatterChannelPrefix}.say`;
    console.log(`TwitchChatter will be listening on ${subChannel}`);
    
    this.redisClient.on("message", (channel, message) => {
        log(`${channel}: "${message}"`);
        if (twitchClient.readyState() == "OPEN") {
            twitchClient.say(twitchChannel, message);
            return;
        }
        
        log(`Twitch client not connected to ${channel}; unable to say "${message}"`);
    });
    
    this.redisClient.subscribe(subChannel);
  }
}

module.exports = TwitchChatter;
//----------------------------------------------------------------

