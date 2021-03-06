# twitch-redis-bridge
Creates an interface to Twitch chat via Redis pub/sub.

## What Is This Thing?
The origins of this package are described [here](https://github.com/laddspencer/twitch-auth/blob/master/README.md#example-code).
This is essentially a Twitch chatbot that serves as a middleman between Twitch chat and a Redis server. It is a key part of the
larger [dacham-nombox](https://github.com/laddspencer/dacham-nombox-server "DacHam-NomBox") system, but could be employed anywhere
Twitch/Redis integration is required.

## Configuration
There are a few configuration options that must be specified before the package can operate properly.
A sample config file ([config_sample.json](https://github.com/laddspencer/twitch-redis-bridge/blob/master/config_sample.json)) is included in the source tree; use this as the basis for your own.
```
{
  "redis": {
    "hostname": "localhost",
    "port": 6379,
    "channel_prefix": "laddspencer"
  },
  "tmi": {
    "channels": [
      "laddspencer"
    ],
    "username": "phantsbot",
    "creds_path": "/path/to/creds.json"
  }
}
```
- redis
  - hostname: the hostname or IP address of the Redis server; the default is **localhost** (127.0.0.1).
  - port: the port on which the Redis server is listening. By default, Redis listens on **6379**.
  - channel_prefix: prefixed used when publishing Redis messages. For example, in this configration, chat messages will be published on a channel called **laddspencer.twitch.message**.
- tmi
  - channels: the list of Twitch chat channels the bot will connect to.
  - username: the account name of the bot. You can use your own Twitch ID or create a new one to serve as the bot. Any text sent to chat by the bot will come from this username. Also note: the credentials provided below will be for *this* account (i.e. it is unrelated to the accounts listed in *tmi.channels* ).
  - creds_path: path to the file containing credentials for *tmi.username*.

## Credentials
A sample creds file ([creds_example.json](https://github.com/laddspencer/twitch-redis-bridge/blob/master/creds_example.json)) is included in the source tree; use this as the basis for your own.
```
{
"client_id": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
"client_secret": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```
*client_id* and *client_secret* come from the Twitch bot/app registration process [here](https://dev.twitch.tv/docs/authentication/#registration). This package assumes you already have or can obtain these creds. Once you have them, simply plug them into your creds file.

## Command-line Options
When run from the command-line, the following options are available:
```
Options:
  -c authcode         OAuth Authorization Code (only needed for first time setup.)
  -F configfile       Configuration file path.
```

## First Run
Since Redis is a fundamental part of this package, we take advantage of the fact that we can easily write data to, and read data from this server. The items cached in Redis are the Twitch OAuth Access Token and Refresh Token. These are used each time your bot connects to chat (i.e. every time you run this script). The tokens are initially obtained by following the authorization procedure [here](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#oauth-authorization-code-flow). Once you grant your bot access, you will receive an Authorization Code; this code is fed to the script on the command-line with the **-c** option. After a successful connection, the Access and Refresh Tokens will be cached in Redis and automatically refreshed as needed; you should never have to use the **-c** option after this (unless the tokens are removed from the Redis cache somehow).


## Pub/Sub Events
Our interface to Twitch is [tmi.js](https://www.npmjs.com/package/tmi.js). Events from Twitch chat (e.g. "Message", "Cheer", "Subscription", etc) are sent to us via **tmi.js**. We translate these events into messages that are published on a Redis pub/sub channel. Channel names are of the form:

*<channel_prefix>*.twitch.*<event_name>*

Where *channel_prefix* is defined in the config file, and *event_name* is one of the events listed in the [tmi.js docs](https://docs.tmijs.org/v1.4.2/Events.html). For example, using the config above, the channel names would be:

```
laddspencer.twitch.action
laddspencer.twitch.anongiftpaidupgrade
laddspencer.twitch.ban
laddspencer.twitch.chat
laddspencer.twitch.cheer
laddspencer.twitch.clearchat
laddspencer.twitch.connected
...
```
Subscribe to any of these channels with your favorite Redis client.

### Follower Events
You might be saying to yourself "how do I get events for new follows?"...the bad news is that Twitch does not provide this over the chat interface, so it's not currently possible with this package. The good news is that **Streamlabs** does provide this, and we've written a peer module, [streamlabs-redis-bridge](https://github.com/laddspencer/streamlabs-redis-bridge), that supports follows and donations.

## Talking Back
In addition to publishing events, we can also forward Redis messages to chat. We do this by listening on the "chatter" channel and sending any text to the [tmi.js say()](https://docs.tmijs.org/v1.4.2/Commands.html#say) command.

*<channel_prefix>*.chatter.say

Where, as above, *channel_prefix* is defined in the config file. For example, after **twitch-redis-bridge** is up and running, connect to the same Redis server and publish a message like this:

```
$ nc localhost 6379
publish laddspencer.chatter.say "Hello, World!"
```
The message will be forwarded through Redis to **twitch-redis-bridge**, which will send it through **tmi.js** to Twitch Chat:
![Twitch Chat Hello World](https://github.com/laddspencer/twitch-redis-bridge/blob/master/hello_world.png "Twitch Chat")
