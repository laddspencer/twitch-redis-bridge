# twitch-redis-bridge
Creates an interface to Twitch chat via Redis pub/sub.

## What Is This Thing?
The origins of this package are described [here](https://github.com/laddspencer/twitch-auth/blob/master/README.md#example-code).
This is essentially a Twitch chatbot that serves as a middleman between Twitch chat and a Redis server. It is a key part of the
larger [dacham-nombox](https://github.com/laddspencer/dacham-nombox-server "DacHam-NomBox") system, but could be employed anywhere
Twitch/Redis integration is required.

## Configuration
There are a few configuration options that must be specified before the package can operate properly.
A sample config file ([config_sample.json](https://github.com/laddspencer/twitch-redis-bridge/blob/master/config_sample.json)) is include in the source tree; use this as the basis for your own.
```
{
  "tmi": {
    "channels": [
      "laddspencer"
    ],
    "username": "phantsbot"
  },
  "redis": {
    "hostname": "localhost",
    "port": 6379,
    "channel_prefix": "laddspencer"
  },
  "credsPath": "/path/to/twitch_creds.json"
}
```
- tmi
  - channels: the list of Twitch chat channels the bot will connect to.
  - username: the account name of the bot. You can use your own Twitch ID or create a new one to serve as the bot. Any text sent to chat by the bot will come from this username. Also note: the credentials provided below will be for *this* account (i.e. it is unrelated to the accounts listed in *tmi.channels* ).
- redis
  - hostname: the hostname or IP address of the Redis server; the default is **localhost** (127.0.0.1).
  - port: the port on which the Redis server is listening. By default, Redis listens on **6379**.
  - channel_prefix: prefixed used when publishing Redis messages. For example, in this configration, chat messages will be published on a channel called **laddspencer.twitch.message**.
- credPath: path to the file containing credentials for *tmi.username*.

## Credentials
A sample creds file ([creds_example.json](https://github.com/laddspencer/twitch-redis-bridge/blob/master/creds_example.json)) is included in the source tree; use this as the basis for your own.
```
{
"client_id": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
"client_secret": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```
*client_id* and *client_secret* come from the Twitch bot/app registration process [here](https://dev.twitch.tv/docs/authentication/#registration). This package assumes you already have or can obtain these creds. Once you have them, simply plug them into your creds file.

## First Run
Since Redis is a fundamental part of this package, we take advantage of the fact that we can easily store and retrieve items from there. The items stored are the Twitch OAuth Access/Refresh Tokens. These are used each time your bot connects to chat (i.e. every time you run this script). The tokens are initially obtained by following the authorization procedure [here](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#oauth-authorization-code-flow). Once you grant your bot access, you will receive an Authorization Code; this code is fed to the script on the command-line with the **-c** option. After a successful connection, the Access and Refresh Tokens will be cached in Redis and automatically refreshed as needed; you should never have to use the **-c** option after this.

## Command-line Options
When run from the command-line, the following options are available:
```
Options:
  -c authcode         OAuth Authorization Code (only needed for first time setup.)
  -F configfile       Configuration file path.
```
