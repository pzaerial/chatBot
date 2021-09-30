const fs = require("fs");
const request = require('request');
const tmi = require('tmi.js');
const config = require('./config.json');

// Read data file
var data = null;
try {
    let rawJSON = fs.readFileSync('./data.json');
    data = JSON.parse(rawJSON);
} catch (err) {
    console.log(`Error reading data from disk: ${err}`);
    process.exit(1)
}
formatData();
var lastSync = new Date();

// Read config
const opts = {
    identity: {
        username: config.username,
        password: config.oauth
    },
    channels: [
        config.channel
    ]
};

//Connect to Twitch & setup handlers
const client = new tmi.client(opts);
client.on('message', onMessageHandler);
client.on('connected', onConnectedHandler);
client.connect();

//Successful connection event
function onConnectedHandler (addr, port) {
    console.log(`Connected to ${addr}:${port}`);
}

//Read chat & delegate commands.
function onMessageHandler (channel, context, msg, self) {
    if (self) { return; } //Ignore messages from this bot

    //Remove whitespace from chat message
    const commandName = msg.trim();

    //(if/else) Chain of command
    if (commandName === '!commands') {
        console.log("User " + context.username + " requested command !commands.");
        commands(channel, context);
    } else if (commandName === '!dws') {
        console.log("User " + context.username + " requested command !dws.");
        dws(channel, context);
    } else if (commandName === '!iws') {
        console.log("User " + context.username + " requested command !iws.");
        iws(channel, context);
    } else if (commandName === '!pws') {
        console.log("User " + context.username + " requested command !pws.");
        pws(channel, context);
    } else if (commandName === '!test') {
        console.log("User " + context.username + " requested command !http.");
        http(channel, context);
    } else {
        console.log(`Unknown command ${commandName}`);
    }

    var curTime = new Date();
    if(Math.abs(curTime.getTime() - lastSync.getTime()) > 3600000){
        console.log("Syncing chatbot data... Time since last sync: " + Math.abs(curTime.getTime() - lastSync.getTime()))
        syncData();
        lastSync = curTime;
    }
}

function commands (channel, context) {
    client.say(channel, "@" + context.username + ": !test ");
}

function dws (channel, context) {
    if (data['voting']['dws'] == null) {
        data['voting']['dws'] = 1;
    } else {
        data['voting']['dws'] = data['voting']['dws'] + 1;
    }
    client.say(channel, "@" + context.username + ": Thank you for voting for DWS! The current standings are PWS: " + data['voting']['pws'] + ", DWS: " + data['voting']['dws'] + ", IWS: " + data['voting']['iws'] + ".");
}

function iws (channel, context) {
    if (data['voting']['iws'] == null) {
        data['voting']['iws'] = 1;
    } else {
        data['voting']['iws'] = data['voting']['iws'] + 1;
    }
    client.say(channel, "@" + context.username + ": Thank you for voting for IWS! The current standings are PWS: " + data['voting']['pws'] + ", DWS: " + data['voting']['dws'] + ", IWS: " + data['voting']['iws'] + ".");
}

function pws (channel, context) {
    if (data['voting']['pws'] == null) {
        data['voting']['pws'] = 1;
    } else {
        data['voting']['pws'] = data['voting']['pws'] + 1;
    }
    client.say(channel, "@" + context.username + ": Thank you for voting for PWS! The current standings are PWS: " + data['voting']['pws'] + ", DWS: " + data['voting']['dws'] + ", IWS: " + data['voting']['iws'] + ".");
}

function http (channel, context) {
    request('https://node.whitney.rip', {json: true}, (error, response, body) => {
        username = context.username
        if(error) {
            client.say(channel, "@" + username + ": Response not recorded! Try again!");
            return console.log(error);
        }
        if(response.statusCode == 200){
            client.say(channel, "@" + username + ": Response recorded!");
        } else {
            client.say(channel, "@" + username + ": Response not recorded! Try again!");
        }
    });
}

function syncData () {
    try {
        let jsonString = JSON.stringify(data);
        fs.writeFileSync('./data.json', jsonString)
    } catch (err) {
        console.log(`Error writing data to disk: ${err}`);
        process.exit(1)
    }
}

function formatData () {
    if(data['voting'] == null) {
        data['voting'] = {};
    }
}

