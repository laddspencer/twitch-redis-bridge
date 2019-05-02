#!/usr/bin/nodejs --harmony
//----------------------------------------------------------------

'use strict';
//----------------------------------------------------------------

// process is always available without using require().
//const process = require('process');
const minimist = require('minimist');
const fs = require('fs');
const tmi = require('tmi.js');
const redis = require('redis');
const util = require('util');
const log = require('fancy-log');
const TwitchEventPublisher = require('./event_publisher');
const TwitchChatter = require('./twitch_chatter');

// Twitch Auth Util (tau)
const tau = require('twitch-auth');

const defaultConfigPath = 'config.json';
const defaultConfig = {
  redis: {
    hostname: 'localhost',
    port: '6379'
  },
  tmi: {
    creds_path: './creds.json',
  }
};

const baseUrl = 'https://id.twitch.tv';
const oathUrl = `${baseUrl}/oauth2`;
const tokenUrl = `${oathUrl}/token`;
const authorizeUrl = `${oathUrl}/authorize`;

const access_token_key = 'access_token';
const refresh_token_key = 'refresh_token';

const bot_name = 'phantsbot';
const redis_key_prefix = bot_name;
//----------------------------------------------------------------

// Q. Does the disconnect event handler get called before/after
//    the promise rejection handler?
// A. It does not get called at all during execution of the promise chain.

// our only task is:
//     - connect to twitch chat
//     - reconnect in the event of a disconnect
//     - forward any and all events to the redis pubsub
//----------------------------------------------------------------

//----------------------------------------------------------------
// Event Handlers
//----------------------------------------------------------------

/**
 * Additional "disconnected" handler that initiates a reconnect.
 */
function onDisconnectedHandler(reason) {
  log(util.format('Disconnected: %s', reason));
  
  // Recover the context object we injected into options.
  let options = this.getOptions();
  let context = options.context;
  let creds = context.creds;
  let publisher = context.publisher;
  
  // Unegister our disconnect handler, then remove the others.
  this.removeListener("disconnected", onDisconnectedHandler);
  publisher.unregisterTwitchEventHandlers(this);
  
  let reconnectPromise = Promise.resolve().then(function() {
    let refresh_token = context.response[refresh_token_key]
    return (tau.refreshUserAccessToken(creds, refresh_token));
  }).catch((reason) => {
    log(reason);
    log("Did the internet go down again?");
    process.exit(1);
  }).then((response) => {
    log("Going around again!");
    return (serve(context.config, creds, publisher, response));
  });
}
//----------------------------------------------------------------

// Helper function to send the correct type of message:
function sendMessage(client, target, context, message) {
  if (context['message-type'] === 'whisper') {
    client.whisper(target, message)
  } else {
    client.say(target, message)
  }
}

function getAccessTokenCacheKey() {
  return (util.format('%s.%s', redis_key_prefix, access_token_key));
}

function getRefreshTokenCacheKey() {
  return (util.format('%s.%s', redis_key_prefix, refresh_token_key));
}

function getCreds(credsPath) {
  let credString = fs.readFileSync(credsPath, 'utf8');
  return (JSON.parse(credString));
}

function getRedisValue(redisClient, key) {
  //log('getRedisValue(redisClient, key)');
  
  return (new Promise((resolve, reject) => {
    redisClient.get(key, (err, result) => {
      log('redis client returned: ' + result);
      if (err) {
        reject(err);
      }
      
      resolve(result);
    });
  }));
}

/**
 * Returns a Promise that resolves to the value of the
 * user access token response sent by the Twitch server.
 *
 * Sample JSON response:
 *   {
 *     "access_token": "<user access token>",
 *     "refresh_token": "<refresh token>",
 *     "expires_in": <number of seconds until the token expires>,
 *     "scope": ["<your previously listed scope(s)>"],
 *     "token_type": "bearer"
 *   }
 */
function getAccessTokenFromAuthCode(creds, code) {
  //log("getAccessTokenFromAuthCode()");
  return (tau.getUserAccessToken(creds, code));
}

function getTokenFromCache(token_key, token_cache_key) {
  let redisDbClient = redis.createClient();
  let tokenPromise = getRedisValue(redisDbClient, token_cache_key).then((results) => {
    //log(`results:  + ${results}`);
    redisDbClient.quit();
    
    // We want the result to look like what you'd find in a JSON response
    // so we can handle both cached and response values in the same way.
    return ({[token_key]: results});
  }).catch((reason) => {
    // Originally implemented this with a nice .finally(),
    //but my version of node does not support it I guess.
    redisDbClient.quit();
  });
  
  return (tokenPromise);
}

function getAccessTokenFromCache() {
  let access_token_cache_key = getAccessTokenCacheKey();
  return (getTokenFromCache(access_token_key, access_token_cache_key));
}

function getRefreshTokenFromCache() {
  let refresh_token_cache_key = getRefreshTokenCacheKey();
  return (getTokenFromCache(refresh_token_key, refresh_token_cache_key));
}

/**
 * Caches access/refresh tokens in the redis DB.
 * The return value is a Promise resolved to the value of token_response.
 */
function cacheTokenResponse(token_response) {
  //log('cacheTokenResponse()');
  
  let access_token_cache_key = getAccessTokenCacheKey();
  let refresh_token_cache_key = getRefreshTokenCacheKey();
  
  let redisDbClient = redis.createClient();
  return (new Promise((resolve, reject) => {
    if ((access_token_key in token_response ) &&
        (refresh_token_key in token_response)) {
      redisDbClient.mset(access_token_cache_key, token_response[access_token_key],
                         refresh_token_cache_key, token_response[refresh_token_key], (err, reply) => {
        // reply ("OK") is useless 
        log('redis client returned: ' + reply);
        
        redisDbClient.quit();
        if (err) {
          reject(err);
        }
        
        resolve(token_response);
      });
    }
    else {
      reject("Did not find the tokens we were looking for.");
    }
  }));
}

function getTwitchOptions(client_id, username, access_token, channels) {
  let opts = {
    options: {
      clientId: client_id,
      debug: true
    },
    identity: {
      username: username,
      password: 'oauth:' + access_token
    },
    channels: channels.slice()
  }
  
  return (opts);
}

function serve(config, creds, publisher, response) {
  let context = {
    'config': config,
    'creds': creds,
    'publisher': publisher,
    'response': response
  };
  
  // Create a client with our tmi options and inject our context so event
  // handlers (specifically the disconnect handler) can access config/creds/response.
  let access_token = response[access_token_key];
  let opts = getTwitchOptions(creds.client_id, config.tmi.username,
                              access_token, config.tmi.channels);
  opts['context'] = context;
  let twitchClient = new tmi.client(opts);
  publisher.registerTwitchEventHandlers(twitchClient);
  
  let twitchChannel = config['tmi']['channels'][0];
  let chatter = new TwitchChatter(twitchClient, twitchChannel, config.redis.hostname,
                                  config.redis.port, config.redis.channel_prefix);
  
  // Register our own disconnect handler so we can reconnect.
  twitchClient.on("disconnected", onDisconnectedHandler);
  
  let servePromise = cacheTokenResponse(response).then((cache_response) => {
    return (twitchClient.connect());
  }).then((data) => {
    log('Connected! Here is the data (do we need to JSON.stringify()?): ' + data);
  }, (err) => {
      log('Uh oh, connection attempt failed. Maybe this error message will be helpful:\n' + err);
  });
}
//----------------------------------------------------------------

function printUsage() {
  console.log("Options:");
  console.log("  -c authcode         OAuth Authorization Code (only needed for first time setup.)");
  console.log("  -F configfile       Configuration file path.");
  console.log("");
}

function parseArgs(argv) {
  let helpString = "help"
  let args = minimist(argv.slice(2), {"boolean":helpString});
  if (args['_'].length > 0) {
    args._.forEach((unknownOption) => {
      console.log(`I don't know what "${unknownOption}" is.`);
    });
    
    printUsage();
    process.exit(1);
  }
  
  if ((helpString in args) &&
      (args[helpString] == true)) {
    printUsage();
    process.exit(0);
  }
  
  return (args);
}

function getConfigPath(args) {
  if ('F' in args) {
    return (args['F']);
  }
  
  return (defaultConfigPath);
}

function getConfig(configPath) {
  let config = defaultConfig;
  try {
    fs.accessSync(configPath, fs.constants.F_OK | fs.constants.R_OK);
    let configString = fs.readFileSync(configPath, 'utf8');
    config = Object.assign(config, JSON.parse(configString));
  }
  catch (err) {
    log(err);
  }
  
  return (config);
}

function cmdLaunch(argv) {
  let args = parseArgs(argv);
  let configPath = getConfigPath(args);
  let config = getConfig(configPath);
  if ('c' in args) {
    config['authCode'] = args['c'];
  }
  
  launch(config);
}

// If specified, launchArg can be a config object or path to config file.
function reqLaunch(launchArg) {
  if (typeof(launchArg) === 'object') {
    launch(launchArg);
    return;
  }
  
  if (typeof(launchArg) === 'string') {
    let config = getConfig(launchArg);
    launch(config);
    return;
  }
  
  launch(defaultConfig);
}

function launch(config) {
  let creds = getCreds(config.creds_path);
  let publisher = new TwitchEventPublisher(config.redis.hostname, config.redis.port,
                                           config.redis.channel_prefix);
  
  // Start with a resolved promise and tack certain
  // promises to the chain depending on command line args.
  // In the end, we should be holding valid access tokens.
  let accessTokenPromise = Promise.resolve();
  if ('authCode' in config) {
    accessTokenPromise = accessTokenPromise.then(function() {
      return (getAccessTokenFromAuthCode(creds, config.authCode));
    });
  }
  else {
    accessTokenPromise = accessTokenPromise.then(function() {
      return (getRefreshTokenFromCache());
    }).then((results) => {
      let refresh_token = results[refresh_token_key];
      return (tau.refreshUserAccessToken(creds, refresh_token));
    });
  }
  
  accessTokenPromise = accessTokenPromise.then((response) => {
    return (serve(config, creds, publisher, response));
  }).catch((err) => {
    log(err);
    process.exit(1);
  });
}
//----------------------------------------------------------------

// TODO: move token caching and cache retrieval into a new class
// that we can easily seed with redis params (e.g. host, port).
// Currently the redis client creation is tucked away in functions
// that don't allow for customization .

// Redis server is run locally for now, no other configuration necessary.
// TODO: does this create an actual connection? If so, promisify createClient() and end() calls.

// If authCode, use tau right off the bat,
// otherwise pull the access_token from redis and try login.
// if failure, use tau to perform refresh.

if (require.main === module) {
  // Run from commandline...
  cmdLaunch(process.argv);
}
else {
  // Run from require()...
  exports.launch = reqLaunch;
}
//----------------------------------------------------------------
