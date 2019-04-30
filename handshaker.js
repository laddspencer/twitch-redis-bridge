
'use strict';
//----------------------------------------------------------------

const redis = require('redis')
const log = require('fancy-log')
//----------------------------------------------------------------

class Handshaker {
  constructor(config, twitchClient) {
    //let twitchChannelName = config.tmi.channels[0];
    let redisHost = config.redis.hostname;
    let redisPort = config.redis.port;
    let channelPrefix = config.redis.channel_prefix;
    let twitchChannelPrefix = `${channelPrefix}.twitch`;
    let chatterChannelPrefix = `${channelPrefix}.chatter`;

    this.subClient = redis.createClient(redisPort, redisHost);
    this.messageChannel = `${twitchChannelPrefix}.message`;
    this.disconnectedChannel = `${twitchChannelPrefix}.disconnected`;
    this.subClient.on("message", this.onSubMessage.bind(this));
    this.subClient.subscribe(this.messageChannel);
    this.subClient.subscribe(this.disconnectedChannel);
    
    this.pubClient = redis.createClient(redisPort, redisHost);
    this.pubChannel = `${chatterChannelPrefix}.say`;
    
    console.log(`Handshaker will be listening on ${this.messageChannel}`);
    console.log(`Handshaker will be listening on ${this.disconnectedChannel}`);
    console.log(`Handshaker will be publishing on ${this.pubChannel}`);
  }
  
  onSubMessage(channel, message) {
    if (channel == this.messageChannel) {
      //log(message);
      let msgObj = JSON.parse(message);
      if (msgObj.self) {
        return;
      }
      
      if (msgObj["message"] == "SYN") {
        this.pubClient.publish(this.pubChannel, "SYN/ACK");
      }
    }
    else if (channel == this.disconnectedChannel) {
      this.subClient.removeListener("message", onSubMessage);
    }
  }
}

module.exports = Handshaker;
//----------------------------------------------------------------

