# pet-all-gotchis
Nodejs App to pet all your Aavegotchis every 12 hours.

Please take care of your Aavegotchis! This is only to be used when you are on vacation or so.

The petting machine notifies you on success or failure in a Discord Channel. The Channel needs to be created upfront. the URL looks like this https://discord.com/api/webhooks/{DISCORD_CHANNELID}/{DISCORD_TOKEN}.

The App is using your private key to sign the ethereum transactions. Beware when you put your private key in the .env File. Keep in mind It's your own fault, if it gets hijacked by using this repo. Always make sure to not publish your .env file.

## Sources 
Base code from https://www.dappuniversity.com/articles/web3-js-intro

AaveGotchi Subgraph https://dev.to/ccoyotedev/building-an-aavegotchi-dapp-using-react-web3-2noe

# Requirements
1. install nodejs
2. run ```npm install```
3. create a Discord channel, insert credentials in .env File
4. Have an polygon node running or use infura. Insert the url under RPC_URL

# How to run
## Develop
node -r esm .\petGotchi.js

## Production
sudo pm2 start .\petGotchi.js

## debug/log
sudo pm2 list
sudo pm2 logs 0 --lines 1000

## .env File
### create a .env file in the root with the following content and change to your credentials:
```
SECRET=Your Private Key e.g. From Metamask
RPC_URL=https://polygon-mainnet.infura.io/v3/xxx
MYETHADDRESS=0x12345678910...
DISCORD_WEBHOOK=
DISCORD_CHANNELID=idxxx
DISCORD_TOKEN=tokenxxx
```