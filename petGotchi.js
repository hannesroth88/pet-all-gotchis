const graphql = require('graphql-request')
require('dotenv').config();
const Discord = require('discord.js');
var schedule = require('node-schedule');
const Tx = require('ethereumjs-tx')
const Web3 = require('web3')

var msgDiscord = ''
// ETH Config
const rpcURL = process.env.RPC_URL;
const web3 = new Web3(rpcURL)
const myAddr = process.env.MYETHADDRESS
const privateKeyHex = Buffer.from(process.env.SECRET, 'hex');
// Contract Data
const smartContrAdr = "0x86935F11C86623deC8a25696E1C19a8659CbF95d"
//ABI from: https://github.com/aavegotchi/aavegotchi-contracts/blob/master/diamondABI/diamond.json
const abi = require('./abi/abiDiamond.json')
const contract = new web3.eth.Contract(abi, smartContrAdr)

//Subgraph
const uriGraph = 'https://api.thegraph.com/subgraphs/name/aavegotchi/aavegotchi-core-matic';

// Setup Discord
const webhookClient = new Discord.WebhookClient(process.env.DISCORD_CHANNELID, process.env.DISCORD_TOKEN);
const embed = new Discord.MessageEmbed()
    .setTitle('Pet Gotchi Bot')
    .setColor('#0099ff');

function sendDiscord(text) {
    webhookClient.send(text, {
        username: 'petAGotchi',
        avatarURL: 'https://i.imgur.com/wSTFkRM.png',
        embeds: [embed],
    });
}

// Fetch Gotchi Details from The Graph
async function fetchUserFromGraph() {
    const queryOwner = graphql.gql`
                            query fetchUser($id: String!) {
                                user(id: $id) {
                                id
                                gotchisOwned {
                                    id
                                    name
                                    lastInteracted
                                    gotchiId
                                }
                                }
                            }
                            `

    const variables = { id: myAddr }
    const response = await graphql.request(uriGraph, queryOwner, variables).catch(() => {
        console.error
        return null
    });
    return response.user
}

function petGotchis(gotchis) {

    // create Gotchi Array
    var gotchiIds = [];
    gotchis.forEach(gotchi => {
        gotchiIds.push(parseInt(gotchi.gotchiId));
    })

    return new Promise((resolve, reject) => {

        web3.eth.getTransactionCount(myAddr, (err, txCount) => {
            const txObject = {
                nonce: web3.utils.toHex(txCount),
                to: smartContrAdr,
                gasLimit: web3.utils.toHex(100000),
                gasPrice: web3.utils.toHex(web3.utils.toWei('40', 'gwei')),
                data: contract.methods.interact(gotchiIds).encodeABI(),
                chainId: web3.utils.toHex(137) // Matic Chain
            };
            console.debug('txObject.data:', txObject.data);
            // Sign the transaction
            const tx = new Tx(txObject);
            tx.sign(privateKeyHex);
            // Serialize
            const serializedTx = tx.serialize();
            const raw = '0x' + serializedTx.toString('hex');
            // console.log('raw:', raw)
            // Broadcast the transaction
            web3.eth.sendSignedTransaction(raw, (err, txHash) => {
                if (!err) {
                    console.log('the Gotchis are looking happy again :)       hash:' + txHash);
                    msgDiscord += 'the Gotchis are looking happy again :)       hash:' + txHash + "\n"
                    resolve()
                } else {
                    console.log('err:', err);
                    msgDiscord += 'something went wrong, better don\'t touch the Gotchis :(       hash:' + txHash + "\n"
                    sendDiscord(msgDiscord + '\n' + err)
                    reject("Error")
                }
            });
        });
    })
}


function dateToLocalDateString(date) {
    return date.toLocaleString("de-DE", { timeZone: "Europe/Berlin" })
}


async function runJob(gotchis) {
    msgDiscord = 'Petting all Gotchis together :)'
    console.log("Petting all Gotchis together :)")

    // finally pet Gotchi
    await petGotchis(gotchis)

    // Send to Discord
    sendDiscord(msgDiscord)

}


async function main() {

    console.log('\n### Starting the Petting Maschine brrbbbbrrr ###');
    sendDiscord('\n### Starting the Petting Maschine brrbbbbrrr ###');


    // Fetch the Gotchis From Graph at Start of App
    const gotchisOwned = await fetchUserFromGraph().then(async user => {

        user.gotchisOwned.forEach(gotchi => {
            dateLastInteracted = new Date(0); // The 0 there is the key, which sets the date to the epoch
            dateLastInteracted.setUTCSeconds(gotchi.lastInteracted);
            gotchi['lastInteractedDate'] = dateToLocalDateString(dateLastInteracted)
        });

        console.log(user.gotchisOwned)
        sendDiscord('Graph API Result:\n' + JSON.stringify(user.gotchisOwned, null, 4) + '\n')
        return user.gotchisOwned;
    }).catch(err => {
        console.error(err)
        sendDiscord(err)
    })


    const jobs = {};
    const delayHours = 0.01 // if you want to start right away give it some time like 0.01h
    const delayedStart = new Date(new Date().getTime() + (delayHours * 3600 * 1000)) // delay the first Jobrun
    console.log('\n### Starting Pet Job ###')
    console.log('First petting on ' + dateToLocalDateString(delayedStart) + '\n')
    msgDiscord = '##########################\n'
    msgDiscord += '#### Starting Pet Job ####\n'
    msgDiscord += '##########################\n'
    msgDiscord += 'First petting on ' + dateToLocalDateString(delayedStart) + '\n'
    sendDiscord(msgDiscord)

    jobs['petJob'] = schedule.scheduleJob(delayedStart, async () => {
        if (gotchisOwned) {
            runJob(gotchisOwned).then(() => {
                // calculate next Pet Job and delay a bit, so it's not too obvious             
                const minSleepSec = 60      // 1 min
                const maxSleepSec = 2 * 60  // 2 min
                const rndWaitSec = Math.random() * (maxSleepSec - minSleepSec) + minSleepSec;
                var nextSchedule = new Date(new Date().getTime() + 12 * 3600 * 1000 + rndWaitSec * 1000);
                console.log('Reschedule for next Petting at ' + dateToLocalDateString(nextSchedule));
                sendDiscord('Reschedule for next Petting at ' + dateToLocalDateString(nextSchedule));
                jobs['petJob'].reschedule(nextSchedule);
            }).catch(() => {
                // try again on error (Polygon in error state, e.g. too busy)                
                var nextScheduleError = new Date(new Date().getTime() + 1 * 3600 * 1000); // 1 hour
                console.log('Error, try again at ' + dateToLocalDateString(nextScheduleError));
                sendDiscord('Error, try again at ' + dateToLocalDateString(nextScheduleError));
                jobs['petJob'].reschedule(nextScheduleError);
            })
        }

    });

}


// #############
// ### START ###
// #############

main()