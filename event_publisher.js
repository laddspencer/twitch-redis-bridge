
'use strict';
//----------------------------------------------------------------

const redis = require("redis");
//----------------------------------------------------------------

// Maps Twitch events to Redis channels.
module.exports = class TwitchEventPublisher {
  constructor(redisHost, redisPort, channelPrefix) {
    this.twitchChannelPrefix = `${channelPrefix}.twitch`;
    this.handlerMap = {
      'action': this.onActionHandler.bind(this),
      'anongiftpaidupgrade': this.onAnongiftpaidupgradeHandler.bind(this),
      'ban': this.onBanHandler.bind(this),
      'chat': this.onChatHandler.bind(this),
      'cheer': this.onCheerHandler.bind(this),
      'clearchat': this.onClearchatHandler.bind(this),
      'connected': this.onConnectedHandler.bind(this),
      'connecting': this.onConnectingHandler.bind(this),
      'disconnected': this.onDisconnectedHandler.bind(this),
      'emoteonly': this.onEmoteonlyHandler.bind(this),
      'emotesets': this.onEmotesetsHandler.bind(this),
      'followersonly': this.onFollowersonlyHandler.bind(this),
      'giftpaidupgrade': this.onGiftpaidupgradeHandler.bind(this),
      'hosted': this.onHostedHandler.bind(this),
      'hosting': this.onHostingHandler.bind(this),
      'join': this.onJoinHandler.bind(this),
      'logon': this.onLogonHandler.bind(this),
      'message': this.onMessageHandler.bind(this),
      'messagedeleted': this.onMessagedeletedHandler.bind(this),
      'mod': this.onModHandler.bind(this),
      'mods': this.onModsHandler.bind(this),
      'notice': this.onNoticeHandler.bind(this),
      'part': this.onPartHandler.bind(this),
      'ping': this.onPingHandler.bind(this),
      'pong': this.onPongHandler.bind(this),
      'r9kbeta': this.onR9kbetaHandler.bind(this),
      'raided': this.onRaidedHandler.bind(this),
      'raw_message': this.onRaw_messageHandler.bind(this),
      'reconnect': this.onReconnectHandler.bind(this),
      'resub': this.onResubHandler.bind(this),
      'roomstate': this.onRoomstateHandler.bind(this),
      'serverchange': this.onServerchangeHandler.bind(this),
      'slowmode': this.onSlowmodeHandler.bind(this),
      'subgift': this.onSubgiftHandler.bind(this),
      'submysterygift': this.onSubmysterygiftHandler.bind(this),
      'subscribers': this.onSubscribersHandler.bind(this),
      'subscription': this.onSubscriptionHandler.bind(this),
      'timeout': this.onTimeoutHandler.bind(this),
      'unhost': this.onUnhostHandler.bind(this),
      'unmod': this.onUnmodHandler.bind(this),
      'vips': this.onVipsHandler.bind(this),
      'whisper': this.onWhisperHandler.bind(this)
    };
    
    let options = {
      'host': redisHost,
      'port': redisPort
    };
    
    this.client = redis.createClient(options);
  }
  
  registerTwitchEventHandlers(twitchClient) {
    let eventNames = Object.keys(this.handlerMap);
    eventNames.forEach((eventName) => {
      //console.log(`key: ${eventName}, value: ${this.handlerMap[eventName]}`);
      console.log(`TwitchEventPublisher will be publishing on ${this.twitchChannelPrefix}.${eventName}`);
      twitchClient.on(eventName, this.handlerMap[eventName]);
    });
  }
  
  unregisterTwitchEventHandlers(twitchClient) {
    let eventNames = Object.keys(this.handlerMap);
    eventNames.forEach((eventName) => {
      //console.log(`key: ${eventName}, value: ${this.handlerMap[eventName]}`);
      twitchClient.removeListener(eventName, this.handlerMap[eventName]);
    });
  }

//----------------------------------------------------------------
// Event Handlers
//----------------------------------------------------------------
  onActionHandler(channel, userstate, message, self) {
    let payload = JSON.stringify({'channel':channel, 'userstate':userstate, 'message':message, 'self':self});
    this.client.publish(`${this.twitchChannelPrefix}.action`, payload);
  }
  
  onAnongiftpaidupgradeHandler(channel, username, userstate) {
    let payload = JSON.stringify({'channel':channel, 'username':username, 'userstate':userstate});
    this.client.publish(`${this.twitchChannelPrefix}.anongiftpaidupgrade`, payload);
  }
  
  onBanHandler(channel, username, reason) {
    let payload = JSON.stringify({'channel':channel, 'username':username, 'reason':reason});
    this.client.publish(`${this.twitchChannelPrefix}.ban`, payload);
  }

  onChatHandler(channel, userstate, message, self) {
    let payload = JSON.stringify({'channel':channel, 'userstate':userstate, 'message':message, 'self':self});
    this.client.publish(`${this.twitchChannelPrefix}.chat`, payload);
  }

  onCheerHandler(channel, userstate, message) {
    let payload = JSON.stringify({'channel':channel, 'userstate':userstate, 'message':message});
    this.client.publish(`${this.twitchChannelPrefix}.cheer`, payload);
  }

  onClearchatHandler(channel) {
    let payload = JSON.stringify({'channel':channel});
    this.client.publish(`${this.twitchChannelPrefix}.clearchat`, payload);
  }

  onConnectedHandler(address, port) {
    let payload = JSON.stringify({'address':address, 'port':port});
    this.client.publish(`${this.twitchChannelPrefix}.connected`, payload);
  }

  onConnectingHandler(address, port) {
    let payload = JSON.stringify({'address':address, 'port':port});
    this.client.publish(`${this.twitchChannelPrefix}.connecting`, payload);
  }

  onDisconnectedHandler(reason) {
    let payload = JSON.stringify({'reason':reason});
    this.client.publish(`${this.twitchChannelPrefix}.disconnected`, payload);
  }

  onEmoteonlyHandler(channel, enabled) {
    let payload = JSON.stringify({'channel':channel, 'enabled':enabled});
    this.client.publish(`${this.twitchChannelPrefix}.emoteonly`, payload);
  }

  onEmotesetsHandler(sets, obj) {
    let payload = JSON.stringify({'sets':sets, 'obj':obj});
    this.client.publish(`${this.twitchChannelPrefix}.emotesets`, payload);
  }
  
  onFollowersonlyHandler(channel, enabled, length) {
    let payload = JSON.stringify({'channel':channel, 'enabled':enabled, 'length':length});
    this.client.publish(`${this.twitchChannelPrefix}.followersonly`, payload);
  }
  
  onGiftpaidupgradeHandler(channel, username, sender, userstate) {
    let payload = JSON.stringify({'channel':channel, 'username':username, 'sender':sender, 'userstate':userstate});
    this.client.publish(`${this.twitchChannelPrefix}.giftpaidupgrade`, payload);
  }
  
  onHostedHandler(channel, username, viewers, autohost) {
    let payload = JSON.stringify({'channel':channel, 'username':username, 'viewers':viewers, 'autohost':autohost});
    this.client.publish(`${this.twitchChannelPrefix}.hosted`, payload);
  }

  onHostingHandler(channel, target, viewers) {
    let payload = JSON.stringify({'channel':channel, 'target':target, 'viewers':viewers});
    this.client.publish(`${this.twitchChannelPrefix}.hosting`, payload);
  }

  onJoinHandler(channel, username, self) {
    let payload = JSON.stringify({'channel':channel, 'username':username, 'self':self});
    this.client.publish(`${this.twitchChannelPrefix}.join`, payload);
  }

  onLogonHandler() {
    let payload = JSON.stringify({});
    this.client.publish(`${this.twitchChannelPrefix}.logon`, payload);
  }

  onMessageHandler(channel, userstate, message, self) {
    let payload = JSON.stringify({'channel':channel, 'userstate':userstate, 'message':message, 'self':self});
    this.client.publish(`${this.twitchChannelPrefix}.message`, payload);
  }

  onMessagedeletedHandler(channel, username, deletedMessage, userstate) {
    let payload = JSON.stringify({'channel':channel, 'username':username, 'deletedMessage':deletedMessage, 'userstate':userstate});
    this.client.publish(`${this.twitchChannelPrefix}.messagedeleted`, payload);
  }

  onModHandler(channel, username) {
    let payload = JSON.stringify({'channel':channel, 'username':username});
    this.client.publish(`${this.twitchChannelPrefix}.mod`, payload);
  }

  onModsHandler(channel, mods) {
    let payload = JSON.stringify({'channel':channel, 'mods':mods});
    this.client.publish(`${this.twitchChannelPrefix}.mods`, payload);
  }

  onNoticeHandler(channel, msgid, message) {
    let payload = JSON.stringify({'channel':channel, 'msgid':msgid, 'message':message});
    this.client.publish(`${this.twitchChannelPrefix}.notice`, payload);
  }

  onPartHandler(channel, username, self) {
    let payload = JSON.stringify({'channel':channel, 'username':username, 'self':self});
    this.client.publish(`${this.twitchChannelPrefix}.part`, payload);
  }

  onPingHandler() {
    let payload = JSON.stringify({});
    this.client.publish(`${this.twitchChannelPrefix}.ping`, payload);
  }

  onPongHandler(latency) {
    let payload = JSON.stringify({'latency':latency});
    this.client.publish(`${this.twitchChannelPrefix}.pong`, payload);
  }

  onR9kbetaHandler(channel, enabled) {
    let payload = JSON.stringify({'channel':channel, 'enabled':enabled});
    this.client.publish(`${this.twitchChannelPrefix}.r9kbeta`, payload);
  }

  onRaidedHandler(channel, username, viewers) {
    let payload = JSON.stringify({'channel':channel, 'username':username, 'viewers':viewers});
    this.client.publish(`${this.twitchChannelPrefix}.raided`, payload);
  }

  onRaw_messageHandler(messageCloned, message) {
    let payload = JSON.stringify({'messageCloned':messageCloned, 'message':message});
    this.client.publish(`${this.twitchChannelPrefix}.raw_message`, payload);
  }

  onReconnectHandler() {
    let payload = JSON.stringify({});
    this.client.publish(`${this.twitchChannelPrefix}.reconnect`, payload);
  }

  onResubHandler(channel, username, months, message, userstate, methods) {
    let payload = JSON.stringify({'channel':channel, 'username':username, 'months':months, 'message':message, 'userstate':userstate, 'methods':methods});
    this.client.publish(`${this.twitchChannelPrefix}.resub`, payload);
    
  }

  onRoomstateHandler(channel, state) {
    let payload = JSON.stringify({'channel':channel, 'state':state});
    this.client.publish(`${this.twitchChannelPrefix}.roomstate`, payload);
  }

  onServerchangeHandler(channel) {
    let payload = JSON.stringify({'channel':channel});
    this.client.publish(`${this.twitchChannelPrefix}.serverchange`, payload);
  }

  onSlowmodeHandler(channel, enabled, length) {
    let payload = JSON.stringify({'channel':channel, 'enabled':enabled, 'length':length});
    this.client.publish(`${this.twitchChannelPrefix}.slowmode`, payload);
  }

  onSubgiftHandler(channel, username, streakMonths, recipient, methods, userstate) {
    let payload = JSON.stringify({'channel':channel, 'username':username, 'streakMonths':streakMonths, 'recipient':recipient, 'methods':methods, 'userstate':userstate});
    this.client.publish(`${this.twitchChannelPrefix}.subgift`, payload);
  }
      
  onSubmysterygiftHandler(channel, username, numbOfSubs, methods, userstate) {
    let payload = JSON.stringify({'channel':channel, 'username':username, 'numbOfSubs':numbOfSubs, 'methods':methods, 'userstate':userstate});
    this.client.publish(`${this.twitchChannelPrefix}.submysterygift`, payload);
  }

  onSubscribersHandler(channel, enabled) {
    let payload = JSON.stringify({'channel':channel, 'enabled':enabled});
    this.client.publish(`${this.twitchChannelPrefix}.subscribers`, payload);
  }

  onSubscriptionHandler(channel, username, method, message, userstate) {
    let payload = JSON.stringify({'channel':channel, 'username':username, 'method':method, 'message':message, 'userstate':userstate});
    this.client.publish(`${this.twitchChannelPrefix}.subscription`, payload);
  }

  onTimeoutHandler(channel, username, reason, duration) {
    let payload = JSON.stringify({'channel':channel, 'username':username, 'reason':reason, 'duration':duration});
    this.client.publish(`${this.twitchChannelPrefix}.timeout`, payload);
  }

  onUnhostHandler(channel, viewers) {
    let payload = JSON.stringify({'channel':channel, 'viewers':viewers});
    this.client.publish(`${this.twitchChannelPrefix}.unhost`, payload);
  }

  onUnmodHandler(channel, username) {
    let payload = JSON.stringify({'channel':channel, 'username':username});
    this.client.publish(`${this.twitchChannelPrefix}.unmod`, payload);
  }

  onVipsHandler(channel, vips) {
    let payload = JSON.stringify({'channel':channel, 'vips':vips});
    this.client.publish(`${this.twitchChannelPrefix}.vips`, payload);
  }

  onWhisperHandler(from, userstate, message, self) {
    let payload = JSON.stringify({'from':from, 'userstate':userstate, 'message':message, 'self':self});
    this.client.publish(`${this.twitchChannelPrefix}.whisper`, payload);
  }
}
//----------------------------------------------------------------
