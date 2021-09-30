const tmi = require('tmi.js');
const request = require('request');
const config = require('./config.json');

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
    } else if (commandName === '!test') {
        console.log("User " + context.username + " requested command !http.");
        http(channel, context);
    } else {
        console.log(`Unknown command ${commandName}`);
    }
}

function commands (channel, context) {
    client.say(channel, "@" + context.username + ": !commands ");
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

