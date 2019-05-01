# twitch-redis-bridge
Creates an interface to Twitch chat via Redis pub/sub.

## What Is This Thing?
The origins of this package are described [here](https://github.com/laddspencer/twitch-auth/blob/master/README.md#example-code).
This is essentially a Twitch chatbot that serves as a middleman between Twitch chat and a Redis server. It is a key part of the
larger [dacham-nombox](https://github.com/laddspencer/dacham-nombox-server "DacHam-NomBox") system, but could be employed anywhere
Twitch/Redis integration is needed.

## Configuration
TODO

## Authorization Code
From that page:

> It uses a local Redis server to cache access/refresh tokens.
> Run it initially with -c <auth code> to get your first user access token.
> After that, it will automatically refresh tokens as necessary.

https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#oauth-authorization-code-flow

TODO
