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

When run from the command-line, the following options are available:
```
Options:
  -c authcode         OAuth Authorization Code (only needed for first time setup.)
  -F configfile       Configuration file path.
```



## Authorization Code
From that page:

> It uses a local Redis server to cache access/refresh tokens.
> Run it initially with -c <auth code> to get your first user access token.
> After that, it will automatically refresh tokens as necessary.

https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#oauth-authorization-code-flow

TODO
